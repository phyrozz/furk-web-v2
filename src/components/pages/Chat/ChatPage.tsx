import { motion } from "framer-motion";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import Navbar from "../../common/Navbar";
import { useState } from "react";
import { loginService } from "../../../services/auth/auth-service";
import MerchantNavbar from "../../common/MerchantNavbar";

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
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const isMerchant = loginService.getUserRole() === 'merchant';

  return (
    <div className="flex pt-16 h-screen bg-gray-100 select-none">
      {isMerchant ? <MerchantNavbar /> : <Navbar />}
      {/* Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-1/4 border-r border-gray-200 bg-white"
      >
        <ChatSidebar onSelectConversation={setSelectedConversation} />
      </motion.div>

      {/* Main Chat Window */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex-1"
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
  );
}
