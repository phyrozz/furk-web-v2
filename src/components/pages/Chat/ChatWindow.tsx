import { useEffect, useState, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { http } from "../../../utils/http";
import { subscribe, send } from "../../../utils/websockets";
import { loginService } from "../../../services/auth/auth-service";
import { useNavigate } from "react-router-dom";
import { ToastService } from "../../../services/toast/toast-service";
import { Flag } from "lucide-react";
import Modal from "../../common/Modal";
import TextareaAutosize from "react-textarea-autosize";
import Button from "../../common/Button";
import { Tooltip } from "../../common/Tooltip";

interface Conversation {
  id: number;
  pet_owner_id: number;
  merchant_id: number;
  merchant_user_id: number;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  business_name: string;
  created_at: string;
  last_message_content: string;
  last_message_created_at: string;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  attachment_url: string | null;
  status: string;
  created_at: string;
  rich_content: any | null;
}

interface Data {
  messages: Message[];
  user_id: number;
  role_name: string;
}

const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export default function ChatWindow({ conversation }: { conversation: Conversation }) {
  const userRole = loginService.getUserRole();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(
    userRole === "merchant" ? conversation.merchant_user_id : conversation.pet_owner_id
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const limit = 50;
  const navigate = useNavigate();
  const resolvedCurrentUserId =
    currentUserId ?? (userRole === "merchant" ? conversation.merchant_user_id : conversation.pet_owner_id);

  /** Fetch paginated messages */
  const fetchMessages = async (offset: number, prepend = false) => {
    if (loading || (!hasMore && prepend)) return;
    setLoading(true);
    try {
      const res = await http.post<{
        success: boolean;
        data: Data;
        limit: number;
        offset: number;
        count: number;
      }>("/merchant-chat/list-messages", {
        conversation_id: conversation.id,
        limit,
        offset,
      });

      if (res.success && res.data) {
        const { messages: newMessages, user_id } = res.data;

        if (currentUserId === null) setCurrentUserId(user_id);
        if (newMessages.length < limit) setHasMore(false);

        setMessages((prev) => {
          const ids = new Set(newMessages.map((m) => m.id));
          const deduped = prev.filter((m) => !ids.has(m.id));
          return prepend
            ? [...newMessages, ...deduped]
            : [...deduped, ...newMessages];
        });
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  /** Initial load when switching conversations */
  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    setCurrentUserId(userRole === "merchant" ? conversation.merchant_user_id : conversation.pet_owner_id);
    fetchMessages(0);
  }, [conversation.id, conversation.merchant_user_id, conversation.pet_owner_id, userRole]);

  /** Auto-scroll to bottom on new message */
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    (async () => {
      unsubscribe = await subscribe((data: any) => {
        if (!active) return; // avoid handling after unmount

        console.log("Received message:", data);

        if (data.event === "new_message" && data.conversation_id === conversation.id) {
          setMessages(prev => {
            // avoid duplicates
            if (prev.some(m => m.id === data.id)) return prev;

            return [
              ...prev,
              {
                id: Date.now(),
                conversation_id: data.conversation_id,
                sender_id: data.sender_id,
                recipient_id: data.recipient_id,
                content: data.content,
                attachment_url: data.attachment_url ?? null,
                status: data.status ?? "received",
                created_at: new Date().toISOString(),
                rich_content: data.rich_content ?? null,
              },
            ];
          });
        }
      });
    })();

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, [conversation.id]);

  /** Infinite scroll (load older messages) */
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (el.scrollTop === 0 && hasMore && !loading) {
      fetchMessages(messages.length, true);
    }
  };

  // send:
  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // validate user is logged in
    const username = await loginService.getUsernameFromToken();
    if (!username) {
      console.error("User not logged in");
      return;
    }

    // optimistic UI first
    setMessages(prev => [...prev, {
      id: Date.now(), // temp id
      conversation_id: conversation.id,
      sender_id: resolvedCurrentUserId,
      recipient_id: conversation.merchant_id,
      content: text,
      attachment_url: null,
      status: "sent",
      created_at: new Date().toISOString(),
      rich_content: null,
    }]);

    // actually send (global socket handles connect/reconnect)
    await send({
      action: "send-message",
      username: username,
      conversation_id: conversation.id,
      content: text,
      attachment_url: null,
    });

    console.log("Message sent successfully", {
      id: Date.now(), // temp id
      conversation_id: conversation.id,
      sender_id: currentUserId!,
      recipient_id: conversation.merchant_id,
      content: text,
      attachment_url: null,
      status: "sent",
      created_at: new Date().toISOString(),
    });
  };

  /** Report conversation */
  const handleSubmitReport  = async () => {
    // Modal component has no handling for loading yet...
    // I guess we'll just close the modal regardless if the report is submitted successfully or not
    setIsReportOpen(false);

    try {
      const res = await http.post<any>("/report/insert", {
        conversation_id: conversation.id,
        reason: reportReason.trim(),
      });

      if (res.success) {
        ToastService.show("Report submitted successfully. Our admins will review it and email you.");
        setIsReportOpen(false);
        setReportReason("");
      } else {
        ToastService.show("Failed to submit report.");
      }
    } catch (err) {
      console.error("Error submitting report:", err);
      ToastService.show("Unable to send report right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const conversationTitle =
    conversation.display_name?.trim() ||
    conversation.business_name ||
    [conversation.first_name, conversation.last_name].filter(Boolean).join(" ").trim() ||
    "Conversation";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        {conversation.business_name ? (
          <button
            onClick={() => navigate(`/merchants/${conversation.merchant_id}`)}
            className="font-semibold hover:text-primary-600 hover:underline transition-all text-left bg-transparent border-none p-0 cursor-pointer"
          >
            {conversationTitle}
          </button>
        ) : (
          <span className="font-semibold text-left">{conversationTitle}</span>
        )}

        {/* Report button */}
        <Tooltip position="left" content="Report conversation">
          <Button
            onClick={() => setIsReportOpen(true)}
            size="sm"
            variant="ghost"
          >
            <Flag size={14} />
          </Button>
        </Tooltip>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 space-y-2 overflow-y-auto bg-gray-50"
      >
        {loading && hasMore && (
          <div className="text-center text-sm text-gray-500">Loading...</div>
        )}

        {[...messages]
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
          .map((m) => (
            <MessageBubble
              key={m.id}
              isMine={m.sender_id === resolvedCurrentUserId}
              text={m.content}
              time={formatMessageTime(m.created_at)}
              richContent={m.rich_content ?? null}
            />
          ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <MessageInput onSend={handleSend} />
      </div>

      {/* Report Modal */}
      <Modal
        isOpen={isReportOpen}
        onClose={() => {
          setIsReportOpen(false);
          setReportReason('');
          setLoading(false);
        }}
        onConfirm={handleSubmitReport}
        showConfirm
        showCancel
        confirmDisabled={!reportReason.trim() || submitting}
        title="Report Conversation"
      >
        <p className="text-sm text-gray-600 mb-2">
          Please describe the issue you want to report. Our team will review it and email you.
        </p>
        <TextareaAutosize
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          placeholder="Enter your reason..."
          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none min-h-[5rem]"
        />
      </Modal>
    </div>
  );
}
