'use client';

import { useConvexAuth } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import Room from "./room";
import { SignInForm } from "./login";
import { useEffect } from "react";

export default function ChatContainer() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const createRoom = useMutation(api.chat.createRoom);
  const generalRoomId = useQuery(api.chat.getGeneralRoom);

  // Create general room if it doesn't exist
  useEffect(() => {
    if (isAuthenticated && !generalRoomId) {
      createRoom({ name: "General", description: "General chat room" });
    }
  }, [isAuthenticated, generalRoomId, createRoom]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <SignInForm />
        </main>
      </div>
    );
  }

  if (!generalRoomId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500">www</div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <Room roomId={generalRoomId} />
    </div>
  );
} 