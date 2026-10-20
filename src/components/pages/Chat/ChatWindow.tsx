import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowUpRight, Flag, Loader2, MessageCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import TextareaAutosize from 'react-textarea-autosize';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { http } from '../../../utils/http';
import { subscribe, send } from '../../../utils/websockets';
import { loginService } from '../../../services/auth/auth-service';
import { ToastService } from '../../../services/toast/toast-service';
import { formatChatDate, formatMessageTime, getConversationName, type ChatActivity, type Conversation, type Message } from './chat-utils';
import ChatAvatar from './ChatAvatar';
import styles from './Chat.module.css';

interface Props {
  conversation: Conversation;
  onBack?: () => void;
  onActivity?: (activity: ChatActivity) => void;
}

export default function ChatWindow({ conversation, onBack, onActivity }: Props) {
  const isMerchant = loginService.getUserRole() === 'merchant';
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState(isMerchant ? conversation.merchant_user_id : conversation.pet_owner_id);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showLatest, setShowLatest] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLOListElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const active = useRef(true);
  const busy = useRef(false);
  const offset = useRef(0);
  const pinnedToBottom = useRef(true);
  const previousScroll = useRef<{ height: number; top: number } | null>(null);
  const request = useRef<AbortController>();
  const reportId = useId();
  const title = getConversationName(conversation, isMerchant);

  const loadMessages = useCallback(async (older = false) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setLoadError(false);
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await http.post<{ success: boolean; data: { messages: Message[]; user_id: number }; count?: number }>(
        '/merchant-chat/list-messages',
        { conversation_id: conversation.id, limit: 50, offset: older ? offset.current : 0 },
        { signal: controller.signal }
      );
      if (!active.current || controller.signal.aborted) return;
      if (!response.success || !Array.isArray(response.data?.messages)) throw new Error('Messages unavailable');
      const incoming = response.data.messages;
      const container = messagesContainerRef.current;
      if (older && container) previousScroll.current = { height: container.scrollHeight, top: container.scrollTop };
      if (!older) offset.current = 0;
      offset.current += incoming.length;
      setHasMore(response.count !== undefined ? offset.current < response.count : incoming.length === 50);
      setCurrentUserId(response.data.user_id);
      setMessages(previous => {
        const incomingIds = new Set(incoming.map(message => message.id));
        return [...previous.filter(message => !incomingIds.has(message.id)), ...incoming]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });
    } catch {
      if (active.current && !controller.signal.aborted) setLoadError(true);
    } finally {
      if (active.current && !controller.signal.aborted) { busy.current = false; setLoading(false); }
    }
  }, [conversation.id]);

  useEffect(() => {
    active.current = true;
    busy.current = false;
    void loadMessages();
    headingRef.current?.focus({ preventScroll: true });
    return () => { active.current = false; request.current?.abort(); };
  }, [loadMessages]);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (previousScroll.current) {
      container.scrollTop = previousScroll.current.top + container.scrollHeight - previousScroll.current.height;
      previousScroll.current = null;
    } else if (pinnedToBottom.current) {
      container.scrollTop = container.scrollHeight;
    } else {
      setShowLatest(true);
    }
  }, [messages]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const container = messagesContainerRef.current;
      if (container && pinnedToBottom.current) container.scrollTop = container.scrollHeight;
    });
    if (messageListRef.current) observer.observe(messageListRef.current);
    if (messagesContainerRef.current) observer.observe(messagesContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let listening = true;
    let unsubscribe: (() => void) | undefined;
    void subscribe((event: Partial<Message> & { event?: string }) => {
      if (!listening || event.event !== 'new_message' || Number(event.conversation_id) !== conversation.id || typeof event.content !== 'string') return;
      const message: Message = {
        id: event.id ?? `socket-${crypto.randomUUID()}`,
        conversation_id: conversation.id,
        sender_id: Number(event.sender_id),
        recipient_id: Number(event.recipient_id),
        content: event.content,
        attachment_url: event.attachment_url ?? null,
        status: event.status ?? 'received',
        created_at: event.created_at || new Date().toISOString(),
        rich_content: event.rich_content ?? null,
      };
      setMessages(previous => previous.some(item => item.id === message.id) ? previous : [...previous, message]);
      offset.current += 1;
      setAnnouncement(`New message from ${title}: ${message.content}`);
    }).then(cleanup => {
      if (listening) unsubscribe = cleanup;
      else cleanup();
    });
    return () => { listening = false; unsubscribe?.(); };
  }, [conversation.id, title]);

  const handleSend = async (text: string) => {
    const username = await loginService.getUsernameFromToken();
    if (!username) throw new Error('Please sign in to send a message');
    const id = `local-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    pinnedToBottom.current = true;
    setShowLatest(false);
    setMessages(previous => [...previous, {
      id, conversation_id: conversation.id, sender_id: currentUserId,
      recipient_id: isMerchant ? conversation.pet_owner_id : conversation.merchant_user_id,
      content: text, attachment_url: null, status: 'pending', created_at: createdAt, rich_content: null, pending: true,
    }]);
    try {
      await send({ action: 'send-message', username, conversation_id: conversation.id, content: text, attachment_url: null });
      if (!active.current) return;
      setMessages(previous => previous.map(message => message.id === id ? { ...message, pending: false } : message));
      offset.current += 1;
      onActivity?.({ conversation_id: conversation.id, content: text, created_at: createdAt });
    } catch (error) {
      if (active.current) setMessages(previous => previous.filter(message => message.id !== id));
      throw error;
    }
  };

  const showNewest = () => {
    pinnedToBottom.current = true;
    setShowLatest(false);
    const container = messagesContainerRef.current;
    if (container) { container.scrollTop = container.scrollHeight; container.focus({ preventScroll: true }); }
  };

  const closeReport = () => {
    if (submitting) return;
    setIsReportOpen(false);
    setReportReason('');
    setReportError(false);
  };

  const submitReport = async () => {
    if (!reportReason.trim() || submitting) return;
    setSubmitting(true);
    setReportError(false);
    try {
      const response = await http.post<{ success: boolean }>('/report/insert', { conversation_id: conversation.id, reason: reportReason.trim() });
      if (!response.success) throw new Error('Report unavailable');
      setIsReportOpen(false);
      setReportReason('');
      ToastService.show('Report submitted. Our team will review it and contact you by email.');
    } catch {
      setReportError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.thread}>
      <header className={styles.threadHeader}>
        {onBack && <button type="button" className={`${styles.iconButton} ${styles.mobileBack}`} onClick={onBack} aria-label="Back to conversations"><ArrowLeft size={22} aria-hidden="true" /></button>}
        <ChatAvatar
          name={title}
          imageUrl={isMerchant ? conversation.pet_owner_image_url : conversation.merchant_image_url}
          variant="header"
        />
        <div className={styles.threadHeading}>
          <h2 ref={headingRef} tabIndex={-1}>{title}</h2>
          {isMerchant ? <p>Pet owner</p> : <Link to={`/merchants/${conversation.merchant_id}`}>View merchant profile<ArrowUpRight size={13} aria-hidden="true" /></Link>}
        </div>
        <button type="button" className={styles.iconButton} onClick={() => setIsReportOpen(true)} aria-label="Report conversation" title="Report conversation"><Flag size={18} aria-hidden="true" /></button>
      </header>

      <div className={styles.history}>
        <div
          ref={messagesContainerRef}
          className={styles.messages}
          tabIndex={0}
          role="region"
          aria-label={`Messages with ${title}`}
          aria-busy={loading}
          onScroll={() => {
            const container = messagesContainerRef.current;
            if (!container) return;
            pinnedToBottom.current = container.scrollHeight - container.scrollTop - container.clientHeight < 72;
            if (pinnedToBottom.current) setShowLatest(false);
          }}
        >
          {loadError && <div className={styles.inlineError} role="alert"><p>Messages couldn’t be loaded. Please try again.</p><button type="button" className={styles.textButton} onClick={() => void loadMessages(messages.length > 0)}>Try again</button></div>}
          {loading && <div className={styles.listLoading} role="status"><Loader2 size={17} className={styles.spinner} aria-hidden="true" />Loading messages…</div>}
          {hasMore && !loading && !loadError && <button type="button" className={styles.loadOlder} onClick={() => void loadMessages(true)}>Load earlier messages</button>}
          {!loading && !loadError && messages.length === 0 && <div className={styles.emptyState}><span className={styles.emptyIcon}><MessageCircle size={26} aria-hidden="true" /></span><h3>Say hello to {title}</h3><p>{isMerchant ? 'A friendly message goes a long way. Help them plan their pet’s next visit.' : 'Ask about services, appointments, or anything your pet needs for their visit.'}</p></div>}
          <ol ref={messageListRef} className={styles.messageList} aria-label="Messages">
            {messages.map((message, index) => {
              const dateLabel = formatChatDate(message.created_at);
              const showDate = index === 0 || formatChatDate(messages[index - 1].created_at) !== dateLabel;
              return (
                <Fragment key={message.id}>
                  {showDate && dateLabel && <li className={styles.dateDivider}><span>{dateLabel}</span></li>}
                  <li><MessageBubble isMine={message.sender_id === currentUserId} text={message.content} time={formatMessageTime(message.created_at)} richContent={message.rich_content} pending={message.pending} animateEntry={reduceMotion !== true && (index >= messages.length - 10 || typeof message.id === 'string')} /></li>
                </Fragment>
              );
            })}
          </ol>
        </div>
        {showLatest && <button type="button" className={styles.jumpButton} onClick={showNewest}>Latest messages<ArrowDown size={16} aria-hidden="true" /></button>}
      </div>
      <div className={styles.composerArea}><MessageInput onSend={handleSend} /></div>
      <span className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{announcement}</span>

      <Dialog open={isReportOpen} onClose={closeReport} className={styles.reportDialog}>
        <div className={styles.reportBackdrop} aria-hidden="true" />
        <div className={styles.reportPosition}>
          <DialogPanel className={styles.reportPanel}>
            <div className={styles.reportHeader}><DialogTitle>Report conversation</DialogTitle><button type="button" className={styles.iconButton} onClick={closeReport} disabled={submitting} aria-label="Close report"><X size={20} aria-hidden="true" /></button></div>
            <Description>Tell us what happened. Our team will review your report and contact you by email.</Description>
            <form onSubmit={event => { event.preventDefault(); void submitReport(); }}>
              <label htmlFor={reportId}>What would you like to report?</label>
              <TextareaAutosize id={reportId} minRows={4} maxRows={8} value={reportReason} onChange={event => setReportReason(event.target.value)} placeholder="Describe the issue…" required disabled={submitting} />
              {reportError && <p className={styles.sendError} role="alert">Your report couldn’t be submitted. Please try again.</p>}
              <div className={styles.reportActions}><button type="button" className={styles.secondaryButton} onClick={closeReport} disabled={submitting}>Cancel</button><button type="submit" className={styles.primaryButton} disabled={!reportReason.trim() || submitting}>{submitting ? 'Submitting…' : 'Submit report'}</button></div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
