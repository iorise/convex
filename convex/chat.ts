import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

// Get current user ID
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const user = await ctx.db.get(userId);
    return user;
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user;
  },
});

// Get or create the general room
export const getGeneralRoom = query({
  args: {},
  handler: async (ctx) => {
    const generalRoom = await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("name"), "General"))
      .first();

    return generalRoom?._id;
  },
});

// Create a new room if it doesn't exist
export const createRoom = mutation({
  args: { name: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, { name, description }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if room already exists
    const existingRoom = await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("name"), name))
      .first();

    if (existingRoom) {
      return existingRoom._id;
    }

    // Create new room
    const roomId = await ctx.db.insert("rooms", {
      name,
      description,
      createdBy: userId,
      createdAt: Date.now(),
      isPrivate: false,
    });

    return roomId;
  },
});

export const sendMessage = mutation({
    args: { roomId: v.id("rooms"), body: v.string() },
    handler: async (ctx, { roomId, body }) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) {
            throw new Error("Not signed in");
        }

        // Verify that the room exists
        const room = await ctx.db.get(roomId);
        if (!room) {
            throw new Error("Room not found");
        }

        // Create the message
        const message = await ctx.db.insert("messages", {
            roomId,
            userId,
            body,
            createdAt: Date.now(),
            isEdited: false,
            isDeleted: false,
        });

        return message;
    },
});

// Query to get messages from a room with pagination
export const getMessages = query({
    args: { 
      roomId: v.id("rooms"),
      paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { roomId, paginationOpts }) => {
        const messagesQuery = ctx.db
            .query("messages")
            .withIndex("by_room", (q) => q.eq("roomId", roomId))
            .order("desc");

        const messages = await messagesQuery.paginate(paginationOpts);

        // Get all unique user IDs from messages
        const userIds = new Set(messages.page.map(m => m.userId));
        
        // Get user data for each message
        const users = await Promise.all(
            Array.from(userIds).map(userId => ctx.db.get(userId))
        );
        
        // Create a map of user data
        const userMap = new Map(
            users.map(user => [user!._id, user])
        );

        // Add user data to each message
        const messagesWithUsers = messages.page.map(message => ({
            ...message,
            user: userMap.get(message.userId),
        }));

        return {
            ...messages,
            page: messagesWithUsers,
        };
    },
});

// Query to get all rooms
export const getRooms = query({
    args: {},
    handler: async (ctx) => {
        const rooms = await ctx.db
            .query("rooms")
            .withIndex("createdAt")
            .order("desc")
            .take(100);

        return rooms;
    },
});

// Delete message mutation
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if the user owns this message
    if (message.userId !== userId) {
      throw new Error("Cannot delete messages from other users");
    }

    // Soft delete the message
    await ctx.db.patch(messageId, {
      isDeleted: true,
      body: "This message has been deleted"
    });

    return true;
  },
});