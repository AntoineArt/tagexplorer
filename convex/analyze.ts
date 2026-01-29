"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from "openai";
import { PdfReader, Item } from "pdfreader";

function buildPrompt(type: "image" | "text", existingTags: string[], fileName: string): string {
  const tagList = existingTags.length > 0
    ? `\nExisting tags in the system: [${existingTags.map(t => `"${t}"`).join(", ")}]\nPrefer reusing existing tags when relevant, but you can propose new ones if needed.\n`
    : "";

  const base = type === "image"
    ? `Analyze this image and suggest relevant tags for organizing it in a personal file system.
Include: subject matter, setting, mood, colors, objects, people, activities.`
    : `Analyze this document text and suggest relevant tags for organizing it in a personal file system.
Include: topic, domain, type of document, key themes.`;

  return `${base}

The file is currently named: "${fileName}"
${tagList}
Rules:
- Return 3-8 tags maximum
- Tags should be single words or short phrases (2-3 words max)
- Use lowercase
- Be specific but not too granular
- Do NOT include: file metadata, technical details, quality assessments
- If the current filename is not descriptive (e.g. "IMG_20240301.jpg", "document(3).pdf", random characters), suggest a better name

Return ONLY a JSON object with this exact format, no explanation:
{
  "existingTags": ["tag1", "tag2"],
  "newTags": ["tag3", "tag4"],
  "suggestedName": "better-name.ext"
}

- "existingTags": tags picked from the existing tags list above
- "newTags": new tags not in the existing list
- "suggestedName": a suggested filename, or null if the current name is already good
${type === "text" ? "\nDocument text:\n" : ""}`;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve) => {
    const textParts: string[] = [];
    new PdfReader().parseBuffer(buffer, (err: Error | string | null, item: Item | null) => {
      if (err) {
        resolve("");
        return;
      }
      if (!item) {
        resolve(textParts.join(" "));
        return;
      }
      if ("text" in item && item.text) {
        textParts.push(item.text);
      }
    });
  });
}

interface AnalysisResult {
  existingTags: string[];
  newTags: string[];
  suggestedName: string | null;
}

export const analyzeFile = action({
  args: {
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileName: v.string(),
    existingTags: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<AnalysisResult> => {
    const fallback: AnalysisResult = { existingTags: [], newTags: ["untagged"], suggestedName: null };

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      throw new Error("AI_GATEWAY_API_KEY not configured");
    }

    const fileBlob = await ctx.storage.get(args.storageId);
    if (!fileBlob) {
      throw new Error("File not found in storage");
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://ai-gateway.vercel.sh/v1",
    });

    try {
      let response;

      if (args.fileType === "application/pdf") {
        const arrayBuffer = await fileBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const extractedText = await extractPdfText(buffer);

        const prompt = buildPrompt("text", args.existingTags, args.fileName);

        if (extractedText.length >= 100) {
          response = await client.chat.completions.create({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt + extractedText.slice(0, 4000) }],
            max_tokens: 500,
          });
        } else {
          response = await client.chat.completions.create({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt + "(PDF with minimal text content - likely a scanned document or image-based PDF)" }],
            max_tokens: 500,
          });
        }
      } else {
        const arrayBuffer = await fileBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        const mimeType = args.fileType.startsWith("image/") ? args.fileType : "image/jpeg";
        const prompt = buildPrompt("image", args.existingTags, args.fileName);

        response = await client.chat.completions.create({
          model: "google/gemini-2.5-flash-lite",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}`, detail: "low" } },
            ],
          }],
          max_tokens: 500,
        });
      }

      const content = response.choices[0]?.message?.content;
      if (!content) return fallback;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Fallback: try to parse as array (old format)
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed)) {
            const tags = parsed.map((t: string) => String(t).toLowerCase().trim()).filter(Boolean);
            const existingSet = new Set(args.existingTags);
            return {
              existingTags: tags.filter((t: string) => existingSet.has(t)),
              newTags: tags.filter((t: string) => !existingSet.has(t)),
              suggestedName: null,
            };
          }
        }
        return fallback;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        existingTags: (parsed.existingTags ?? []).map((t: string) => String(t).toLowerCase().trim()).filter(Boolean),
        newTags: (parsed.newTags ?? []).map((t: string) => String(t).toLowerCase().trim()).filter(Boolean),
        suggestedName: parsed.suggestedName ?? null,
      };
    } catch (error) {
      console.error("AI analysis error:", error);
      return fallback;
    }
  },
});
