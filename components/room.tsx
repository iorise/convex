import { FormEvent, useRef, useEffect, useState } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";

interface RoomProps {
  roomId: Id<"rooms">;
}

export default function Room({ roomId }: RoomProps) {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);

  const { results: messages, status, loadMore } = usePaginatedQuery(
    api.chat.getMessages,
    { roomId },
    { initialNumItems: 10 }
  );
  
  const sendMessage = useMutation(api.chat.sendMessage);
  const deleteMessage = useMutation(api.chat.deleteMessage);
  const currentUser = useQuery(api.chat.getCurrentUser);

  // Save scroll height before loading more messages
  useEffect(() => {
    if (status === "LoadingMore" && messageContainerRef.current) {
      setPrevScrollHeight(messageContainerRef.current.scrollHeight);
    }
  }, [status]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (!messageContainerRef.current || !messages) return;
    
    const container = messageContainerRef.current;
    
    if (messages.length > prevMessagesLength && !shouldScrollToBottom) {
      // Calculate how many pixels were added
      const heightDiff = container.scrollHeight - prevScrollHeight;
      // Adjust scroll position to maintain relative position
      requestAnimationFrame(() => {
        container.scrollTop = heightDiff;
      });
    } else if (shouldScrollToBottom) {
      // When new message arrives, scroll to bottom
      container.scrollTop = container.scrollHeight;
    }
    
    setPrevMessagesLength(messages.length);
  }, [messages, shouldScrollToBottom, prevMessagesLength, prevScrollHeight]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const loadingElement = loadingRef.current;
    if (!loadingElement) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && status === "CanLoadMore") {
          setShouldScrollToBottom(false);
          loadMore(10);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadingElement);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [status, loadMore]);

  // Auto-scroll to bottom on first load and new messages
  useEffect(() => {
    if (messageContainerRef.current && shouldScrollToBottom) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, shouldScrollToBottom]);

  // Ensure initial scroll position is at bottom
  useEffect(() => {
    if (messageContainerRef.current && messages.length > 0) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, []); // Only run once on component mount

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim() || !currentUser) return;

    try {
      setShouldScrollToBottom(true); // Scroll to bottom when sending new message
      await sendMessage({ roomId, body: input.value });
      input.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: Id<"messages">) => {
    try {
      await deleteMessage({ messageId });
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  if (!messages || !currentUser) return <div className="flex items-center justify-center h-full">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-4xl mx-auto">
      {/* Messages Container */}
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4"
      >
        <div className="flex flex-col-reverse min-h-full">
          {status === "LoadingMore" && (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          {messages.map((message: any, index: number) => {
            const isCurrentUser = message.userId === currentUser._id;
            const isLoadTriggerMessage = index === messages.length - 1 && (messages.length % 10 === 0) && status === "CanLoadMore";

            return (
              <div
                key={message._id}
                ref={isLoadTriggerMessage ? loadingRef : null}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}
              >
                <div className="flex flex-col max-w-[70%] group">
                  {/* Sender name */}
                  <span 
                    className={`text-xs mb-1 ${
                      isCurrentUser ? "text-right" : "text-left"
                    } text-gray-500`}
                  >
                    {isCurrentUser ? "You" : message.user?.name || "Anonymous"}
                  </span>
                  {/* Message bubble */}
                  <div className="relative">
                    <div
                      className={`rounded-lg p-3 ${
                        message.isDeleted 
                          ? "bg-gray-100 text-gray-500 italic"
                          : isCurrentUser
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{message.body}</p>
                      <span className="text-xs opacity-75 mt-1 block">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {/* Delete button */}
                    {isCurrentUser && !message.isDeleted && (
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700"
                        title="Delete message"
                      >
                        delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
