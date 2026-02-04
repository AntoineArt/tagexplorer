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
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", {
      storageId: args.storageId,
      name: args.name,
      type: args.type,
      size: args.size,
      createdAt: Date.now(),
    });
  },
});

export const listFiles = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("files").collect();
    return files.filter((f) => !f.deletedAt);
  },
});

export const listDeletedFiles = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("files").collect();
    return files.filter((f) => f.deletedAt);
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const renameFile = mutation({
  args: {
    fileId: v.id("files"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, { name: args.name });
  },
});

export const softDeleteFile = mutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, { deletedAt: Date.now() });
  },
});

export const restoreFile = mutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, { deletedAt: undefined });
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

export const permanentDeleteFile = mutation({
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

export const emptyTrash = mutation({
  args: {},
  handler: async (ctx) => {
    const deletedFiles = await ctx.db.query("files").collect();
    const toDelete = deletedFiles.filter((f) => f.deletedAt);

    for (const file of toDelete) {
      await ctx.storage.delete(file.storageId);
      const fileTags = await ctx.db
        .query("fileTags")
        .withIndex("by_file", (q) => q.eq("fileId", file._id))
        .collect();
      for (const ft of fileTags) {
        await ctx.db.delete(ft._id);
      }
      await ctx.db.delete(file._id);
    }

    return toDelete.length;
  },
});
