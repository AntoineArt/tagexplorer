import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    name: v.string(),
    type: v.string(),
    storageId: v.id("_storage"),
    size: v.optional(v.number()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("by_deleted", ["deletedAt"]),

  tags: defineTable({
    name: v.string(),
    color: v.optional(v.string()),
    parentId: v.optional(v.id("tags")),
  }).index("by_name", ["name"]),

  fileTags: defineTable({
    fileId: v.id("files"),
    tagId: v.id("tags"),
  })
    .index("by_file", ["fileId"])
    .index("by_tag", ["tagId"]),
});
