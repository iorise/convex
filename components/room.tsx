import { FormEvent, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";

interface RoomProps {
  roomId: Id<"rooms">;
}

export default function Room({ roomId }: RoomProps) {
  const messages = useQuery(api.chat.getMessages, { roomId });
  const sendMessage = useMutation(api.chat.sendMessage);
  const currentUser = useQuery(api.chat.getCurrentUser);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim() || !currentUser) return;

    try {
      await sendMessage({ roomId, body: input.value });
      input.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!messages || !currentUser) return <div className="flex items-center justify-center h-full">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-4xl mx-auto">
      {/* Messages Container */}
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message: any) => {
          const isCurrentUser = message.userId === currentUser._id;
          return (
            <div
              key={message._id}
              className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col max-w-[70%]">
                {/* Sender name */}
                <span 
                  className={`text-xs mb-1 ${
                    isCurrentUser ? "text-right" : "text-left"
                  } text-gray-500`}
                >
                  {isCurrentUser ? "You" : message.user?.name || "Anonymous"}
                </span>
                {/* Message bubble */}
                <div
                  className={`rounded-lg p-3 ${
                    isCurrentUser
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <p className="text-sm">{message.body}</p>
                  <span className="text-xs opacity-75 mt-1 block">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <form 
        onSubmit={handleSendMessage}
        className="border-t border-gray-200 p-4 bg-white"
      >
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded-full px-6 py-2 hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
