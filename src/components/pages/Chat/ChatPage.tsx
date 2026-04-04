import { motion } from "framer-motion";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import { useEffect, useState } from "react";
import TopNavbarPageShell from "../../common/TopNavbarPageShell";
import MerchantNavbar from "../../common/MerchantNavbar";
import { loginService } from "../../../services/auth/auth-service";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MerchantDetailsService } from "../../../services/merchant-details/merchant-details";

interface Conversation {
  id: number;
  pet_owner_id: number;
  merchant_id: number;
  merchant_user_id: number;
  business_name: string;
  created_at: string;
  last_message_content: string;
  last_message_created_at: string;
}

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    () => (location.state as { conversation?: Conversation } | null)?.conversation ?? null
  );
  const isMerchant = loginService.getUserRole() === 'merchant';
  const merchantDetailsService = new MerchantDetailsService();
  const chatBasePath = isMerchant ? '/merchant/chat' : '/chat';

  useEffect(() => {
    const conversation = (location.state as { conversation?: Conversation } | null)?.conversation;
    setSelectedConversation(conversation ?? null);
  }, [location.state]);

  useEffect(() => {
    let active = true;

    const loadConversation = async () => {
      if (!conversationId) return;

      try {
        const response = await merchantDetailsService.getConversation(conversationId);
        if (!active) return;
        setSelectedConversation(response.data);
      } catch (error) {
        console.error("Failed to load conversation:", error);
      }
    };

    loadConversation();

    return () => {
      active = false;
    };
  }, [conversationId, location.state]);

  const handleSelectConversation = (conversation: Conversation | null) => {
    setSelectedConversation(conversation);

    if (!conversation) {
      navigate(chatBasePath, { replace: true });
      return;
    }

    navigate(`${chatBasePath}/${conversation.id}`, {
      replace: true,
      state: { conversation },
    });
  };

  if (isMerchant) {
    return (
      <>
        <MerchantNavbar />
        <div className="min-h-screen bg-gray-100 select-none pt-16 lg:pt-0 lg:pl-[var(--merchant-navbar-width,18rem)]">
          <div className="flex h-[calc(100vh-5rem)] lg:h-[calc(100vh-1.5rem)] bg-gray-100 overflow-hidden">
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-1/4 min-w-[280px] border-r border-gray-200 bg-white"
            >
              <ChatSidebar onSelectConversation={handleSelectConversation} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex-1 min-w-0"
            >
              {selectedConversation ? (
                <ChatWindow conversation={selectedConversation} />
              ) : (
                <div className="h-full flex items-center justify-center bg-white">
                  <p className="text-gray-400 text-lg">Select a conversation to start chatting</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  return (
    <TopNavbarPageShell className="select-none">
      <div className="flex h-[calc(100vh-4rem)] bg-gray-100 overflow-hidden">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-1/4 min-w-[280px] border-r border-gray-200 bg-white"
        >
          <ChatSidebar onSelectConversation={handleSelectConversation} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex-1 min-w-0"
        >
          {selectedConversation ? (
            <ChatWindow conversation={selectedConversation} />
          ) : (
            <div className="h-full flex items-center justify-center bg-white">
              <p className="text-gray-400 text-lg">Select a conversation to start chatting</p>
            </div>
          )}
        </motion.div>
      </div>
    </TopNavbarPageShell>
  );
}
