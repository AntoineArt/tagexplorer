import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTag = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedName = args.name.toLowerCase().trim();
    const existing = await ctx.db
      .query("tags")
      .withIndex("by_name", (q) => q.eq("name", normalizedName))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("tags", {
      name: normalizedName,
      color: args.color,
    });
  },
});

export const listTags = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tags").collect();
  },
});

export const updateTagColor = mutation({
  args: {
    tagId: v.id("tags"),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tagId, { color: args.color || undefined });
  },
});

export const renameTag = mutation({
  args: {
    tagId: v.id("tags"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedName = args.name.toLowerCase().trim();

    const existing = await ctx.db
      .query("tags")
      .withIndex("by_name", (q) => q.eq("name", normalizedName))
      .first();

    if (existing && existing._id !== args.tagId) {
      throw new Error("TAG_NAME_EXISTS");
    }

    await ctx.db.patch(args.tagId, { name: normalizedName });
  },
});

export const mergeTags = mutation({
  args: {
    sourceTagId: v.id("tags"),
    targetTagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const sourceLinks = await ctx.db
      .query("fileTags")
      .withIndex("by_tag", (q) => q.eq("tagId", args.sourceTagId))
      .collect();

    for (const link of sourceLinks) {
      const existingLink = await ctx.db
        .query("fileTags")
        .withIndex("by_file", (q) => q.eq("fileId", link.fileId))
        .filter((q) => q.eq(q.field("tagId"), args.targetTagId))
        .first();

      if (!existingLink) {
        await ctx.db.insert("fileTags", {
          fileId: link.fileId,
          tagId: args.targetTagId,
        });
      }

      await ctx.db.delete(link._id);
    }

    await ctx.db.delete(args.sourceTagId);
  },
});

export const deleteTag = mutation({
  args: { tagId: v.id("tags") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("fileTags")
      .withIndex("by_tag", (q) => q.eq("tagId", args.tagId))
      .collect();

    for (const link of links) {
      await ctx.db.delete(link._id);
    }

    await ctx.db.delete(args.tagId);
  },
});

export const linkFileTag = mutation({
  args: {
    fileId: v.id("files"),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("fileTags")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .filter((q) => q.eq(q.field("tagId"), args.tagId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("fileTags", {
      fileId: args.fileId,
      tagId: args.tagId,
    });
  },
});

export const unlinkFileTag = mutation({
  args: {
    fileId: v.id("files"),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("fileTags")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .filter((q) => q.eq(q.field("tagId"), args.tagId))
      .first();

    if (link) {
      await ctx.db.delete(link._id);
    }
  },
});

export const getFileTags = query({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("fileTags")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .collect();

    const tags = await Promise.all(
      links.map((link) => ctx.db.get(link.tagId))
    );

    return tags.filter((tag) => tag !== null);
  },
});

export const listFileTags = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("fileTags").collect();
  },
});

export const bulkLinkFileTags = mutation({
  args: {
    fileId: v.id("files"),
    tagNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    for (const name of args.tagNames) {
      const normalized = name.toLowerCase().trim();
      let tag = await ctx.db
        .query("tags")
        .withIndex("by_name", (q) => q.eq("name", normalized))
        .first();

      if (!tag) {
        const id = await ctx.db.insert("tags", { name: normalized });
        tag = (await ctx.db.get(id))!;
      }

      const existing = await ctx.db
        .query("fileTags")
        .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
        .filter((q) => q.eq(q.field("tagId"), tag!._id))
        .first();

      if (!existing) {
        await ctx.db.insert("fileTags", { fileId: args.fileId, tagId: tag._id });
      }
    }
  },
});

export const getTagFileCount = query({
  args: { tagId: v.id("tags") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("fileTags")
      .withIndex("by_tag", (q) => q.eq("tagId", args.tagId))
      .collect();
    return links.length;
  },
});
