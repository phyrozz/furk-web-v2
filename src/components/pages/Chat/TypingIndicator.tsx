import { motion } from "framer-motion";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 pl-2 text-gray-500">
      <motion.span
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 0.6 }}
      />
      <motion.span
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
      />
      <motion.span
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
      />
    </div>
  );
}
