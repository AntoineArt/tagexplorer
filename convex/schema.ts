import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    name: v.string(),
    type: v.string(),
    storageId: v.id("_storage"),
    createdAt: v.number(),
  }),

  tags: defineTable({
    name: v.string(),
    color: v.optional(v.string()),
  }).index("by_name", ["name"]),

  fileTags: defineTable({
    fileId: v.id("files"),
    tagId: v.id("tags"),
  })
    .index("by_file", ["fileId"])
    .index("by_tag", ["tagId"]),
});
