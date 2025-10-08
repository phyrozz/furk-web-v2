import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onSend: (msg: string) => void;
}

export default function MessageInput({ onSend }: Props) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring focus:ring-primary-300"
        placeholder="Type a message..."
      />
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleSend}
        className="px-4 py-2 font-medium text-white bg-primary-500 rounded-lg shadow hover:bg-primary-600"
      >
        Send
      </motion.button>
    </div>
  );
}
