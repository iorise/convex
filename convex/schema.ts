import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom field.
    favoriteColor: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  rooms: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    isPrivate: v.optional(v.boolean()),
  }).index("createdAt", ["createdAt"]),

  messages: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isEdited: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
  })
    .index("by_room", ["roomId", "createdAt"])
    .index("by_user", ["userId", "createdAt"]),
});