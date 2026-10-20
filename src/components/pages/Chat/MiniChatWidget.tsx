import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatWindow from "./ChatWindow";
import { http } from "../../../utils/http";
import { loginService } from "../../../services/auth/auth-service";
import { subscribe } from "../../../utils/websockets";
import { useLazyLoad } from "../../../hooks/useLazyLoad";
import ChatAvatar from "./ChatAvatar";
import { getConversationName, type Conversation } from "./chat-utils";

export default function MiniChatWidget({ aboveBottomNav = false }: { aboveBottomNav?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const isMerchant = loginService.getUserRole() === "merchant";
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState<Record<number, boolean>>({});
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  // 🔹 Lazy-loaded conversations
  const fetchConversations = async (limit: number, offset: number): Promise<Conversation[]> => {
    try {
      const username = await loginService.getUsernameFromToken();
      if (!username) throw new Error("User not logged in");

      const res = await http.post<{
        success: boolean;
        data: Conversation[];
      }>("/merchant-chat/list-conversations", { limit, offset });

      return res.data || [];
    } catch (err) {
      console.error("Error fetching conversations:", err);
      return [];
    }
  };

  const { items: conversations, loadMore, loading, hasMore, reset } = useLazyLoad<Conversation>({
    fetchData: fetchConversations,
    limit: 20,
    enabled: isOpen,
  });

  // 🔹 Handle intersection observer for infinite scroll
  const lastConversationRef = useCallback(
    (node: HTMLLIElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  // 🔹 WebSocket: update last message + unread logic
  useEffect(() => {
    const setupSubscription = async () => {
      unsubscribeRef.current = await subscribe((data: { event?: string; conversation_id?: number | string; chat_id?: number | string }) => {
        if (data.event !== "new_message") return;

        const conversationId = Number(data.conversation_id ?? data.chat_id);
        if (!Number.isSafeInteger(conversationId) || conversationId <= 0) return;

        reset(); // Quick refresh of current page to reflect newest message

        // Add unread indicator
        if (conversationId !== activeConversation?.id) {
          setUnreadConversations((prev) => ({
            ...prev,
            [conversationId]: true,
          }));
          if (!isOpen) setUnreadCount((prev) => prev + 1);
        }
      });
    };

    setupSubscription();
    return () => unsubscribeRef.current?.();
  }, [isOpen, activeConversation, reset]);

  // 🔹 Handle conversation select
  const handleSelectConversation = (c: Conversation) => {
    setActiveConversation(c);
    setUnreadConversations((prev) => {
      const updated = { ...prev };
      delete updated[c.id];
      return updated;
    });
  };

  const handleBackToList = () => {
    setActiveConversation(null);
  };

  return (
    <div
      className={`fixed right-6 z-30 flex flex-col items-end gap-3 select-none ${
        aboveBottomNav ? 'bottom-[calc(7rem_+_env(safe-area-inset-bottom))] lg:bottom-6' : 'bottom-6'
      }`}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-80 max-w-[calc(100vw_-_2rem)] h-[min(30rem,calc(100dvh_-_16.5rem_-_env(safe-area-inset-bottom)))] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50">
              {activeConversation ? (
                <>
                  <button onClick={handleBackToList} className="p-1 text-gray-500 hover:text-gray-700">
                    <ChevronLeft size={18} />
                  </button>
                  <ChatAvatar
                    name={getConversationName(activeConversation, isMerchant)}
                    imageUrl={isMerchant ? activeConversation.pet_owner_image_url : activeConversation.merchant_image_url}
                    variant="compact"
                  />
                  <h4 className="font-semibold text-sm truncate flex-1 text-center">
                    {getConversationName(activeConversation, isMerchant)}
                  </h4>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setUnreadCount(0);
                      setActiveConversation(null);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <X size={18} />
                  </button>
                </>
              ) : (
                <>
                  <h4 className="font-semibold text-sm">Messages</h4>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setUnreadCount(0);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <X size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeConversation ? (
                <ChatWindow key={activeConversation.id} conversation={activeConversation} />
              ) : (
                <div className="overflow-y-auto h-full">
                  {loading && conversations.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      Loading...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                      No conversations found
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {conversations.map((c, index) => {
                        const isUnread = unreadConversations[c.id];
                        const isLast = index === conversations.length - 1;
                        const name = getConversationName(c, isMerchant);
                        return (
                          <li
                            key={c.id}
                            ref={isLast ? lastConversationRef : null}
                            onClick={() => handleSelectConversation(c)}
                            className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                          >
                            <ChatAvatar
                              name={name}
                              imageUrl={isMerchant ? c.pet_owner_image_url : c.merchant_image_url}
                              variant="compact"
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm truncate ${
                                  isUnread ? "font-bold text-gray-900" : "font-medium text-gray-700"
                                }`}
                              >
                                {name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {c.last_message_content || "No messages yet"}
                              </p>
                            </div>
                            {isUnread && (
                              <span className="ml-2 w-2 h-2 bg-primary-500 rounded-full"></span>
                            )}
                          </li>
                        );
                      })}
                      {loading && (
                        <li className="p-3 text-center text-gray-400 text-sm">Loading more...</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) setUnreadCount(0);
        }}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary-500 shadow-lg hover:bg-primary-600 text-white"
      >
        <MessageCircle size={26} />
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread messages`}
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full"
          >
            {unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}
