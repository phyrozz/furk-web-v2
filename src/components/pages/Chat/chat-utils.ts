export interface Conversation {
  id: number;
  pet_owner_id: number;
  merchant_id: number;
  merchant_user_id: number;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  pet_owner_image_url?: string | null;
  merchant_image_url?: string | null;
  business_name: string;
  created_at: string;
  last_message_content?: string | null;
  last_message_created_at?: string | null;
}

export interface RichContent {
  type: string;
  title?: string;
  business_name?: string;
  image_url?: string;
  price?: number;
}

export interface Message {
  id: number | string;
  conversation_id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  attachment_url: string | null;
  status: string;
  created_at: string;
  rich_content: RichContent | null;
  pending?: boolean;
}

export interface ChatActivity {
  conversation_id: number;
  content: string;
  created_at: string;
}

export function getConversationName(conversation: Conversation, isMerchant: boolean) {
  if (!isMerchant) return conversation.business_name?.trim() || conversation.display_name?.trim() || 'Merchant';
  const ownerName = [conversation.first_name, conversation.last_name].filter(Boolean).join(' ').trim();
  return ownerName || (conversation.display_name !== conversation.business_name && conversation.display_name?.trim()) || 'Pet owner';
}

export function getInitials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join('').toLocaleUpperCase();
}

export function searchConversations(conversations: Conversation[], query: string, isMerchant: boolean) {
  const normalized = query.trim().toLocaleLowerCase();
  return conversations.filter(conversation =>
    `${getConversationName(conversation, isMerchant)} ${conversation.last_message_content ?? ''}`.toLocaleLowerCase().includes(normalized)
  );
}

export function updateConversationPreview(conversations: Conversation[], activity: ChatActivity) {
  const conversation = conversations.find(item => item.id === activity.conversation_id);
  if (!conversation) return conversations;
  return [
    { ...conversation, last_message_content: activity.content, last_message_created_at: activity.created_at },
    ...conversations.filter(item => item.id !== activity.conversation_id),
  ];
}

function validDate(timestamp?: string | null) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatMessageTime(timestamp: string) {
  const date = validDate(timestamp);
  return date ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date) : '';
}

export function formatChatDate(timestamp?: string | null, now = new Date()) {
  const date = validDate(timestamp);
  if (!date) return '';
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) }).format(date);
}

export function formatInboxTime(timestamp?: string | null) {
  return formatChatDate(timestamp) === 'Today' ? formatMessageTime(timestamp!) : formatChatDate(timestamp);
}
