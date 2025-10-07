import { motion } from "framer-motion";
import { useState, useCallback, useRef } from "react";
import { Search, RefreshCw } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useLazyLoad } from "../../../hooks/useLazyLoad";
import { http } from "../../../utils/http";

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

export default function ChatSidebar({ onSelectConversation }: { onSelectConversation: (conversation: Conversation | null) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 50;

  const fetchConversations = async (limit: number, offset: number): Promise<Conversation[]> => {
    try {
      setError(null);
      const json = await http.post<{
        success: boolean;
        message?: string;
        data: Conversation[];
        limit: number;
        offset: number;
        count: number;
      }>("/merchant-chat/list-conversations", {
        limit,
        offset,
        search: debouncedSearchTerm,
      });

      if (!json || !json.data) {
        throw new Error("Invalid response format");
      }

      return json.data;
    } catch (err: any) {
      setError("Failed to fetch conversations: " + (err.message || "Unknown error"));
      console.error("Error fetching conversations:", err);
      return [];
    }
  };

  const { items: conversations, loading, hasMore, loadMore, reset } = useLazyLoad<Conversation>({
    fetchData: fetchConversations,
    limit,
    dependencies: [debouncedSearchTerm, refreshKey],
  });

  const observer = useRef<IntersectionObserver>();
  const lastConversationElementRef = useCallback(
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

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    reset();
  };

  return (
    <div className="h-full overflow-y-auto bg-white rounded-lg shadow">
      {/* Search and Refresh */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <ul className="divide-y">
        {error ? (
          <li className="p-4 text-center text-red-500">{error}</li>
        ) : conversations.length === 0 ? (
          <li className="p-4 text-center text-gray-500">No conversations found</li>
        ) : (
          conversations.map((c, index) => (
            <motion.li
              key={`${c.id}-${index}`}
              ref={index === conversations.length - 1 ? lastConversationElementRef : undefined}
              className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50"
              onClick={() => onSelectConversation(c)}
            >
              <div>
                <p className="font-medium">{c.business_name}</p>
                {/* <p className="text-sm text-gray-500 truncate">{c.last_message_content}</p> */}
              </div>
              {/* {c.unread > 0 && (
                <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary-500 rounded-full">
                  {c.unread}
                </span>
              )} */}
            </motion.li>
          ))
        )}
        {loading && (
          <li className="p-4 text-center">
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce" />
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce delay-100" />
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce delay-200" />
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}
