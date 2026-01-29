import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", {
      storageId: args.storageId,
      name: args.name,
      type: args.type,
      createdAt: Date.now(),
    });
  },
});

export const listFiles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("files").collect();
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const deleteFile = mutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (file) {
      await ctx.storage.delete(file.storageId);
      const fileTags = await ctx.db
        .query("fileTags")
        .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
        .collect();
      for (const ft of fileTags) {
        await ctx.db.delete(ft._id);
      }
      await ctx.db.delete(args.fileId);
    }
  },
});
