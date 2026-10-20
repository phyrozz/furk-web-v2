import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, MessageCircle, RefreshCw } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import TopNavbarPageShell from '../../common/TopNavbarPageShell';
import MerchantNavbar from '../../common/MerchantNavbar';
import { loginService } from '../../../services/auth/auth-service';
import { http } from '../../../utils/http';
import type { ChatActivity, Conversation } from './chat-utils';
import styles from './Chat.module.css';

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const isMerchant = loginService.getUserRole() === 'merchant';
  const chatBasePath = isMerchant ? '/merchant/chat' : '/chat';
  const routeConversation = (location.state as { conversation?: Conversation } | null)?.conversation;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [activity, setActivity] = useState<ChatActivity>();
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const reduceMotion = useReducedMotion();
  const pageRef = useRef<HTMLElement>(null);
  const inboxPaneRef = useRef<HTMLElement>(null);
  const threadPaneRef = useRef<HTMLElement>(null);
  const selectedConversation = conversation?.id === Number(conversationId) ? conversation
    : routeConversation?.id === Number(conversationId) ? routeConversation : null;

  useEffect(() => {
    const breakpoint = window.matchMedia('(min-width: 768px)');
    const updateLayout = () => setIsDesktop(breakpoint.matches);
    breakpoint.addEventListener('change', updateLayout);
    return () => breakpoint.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    if (inboxPaneRef.current) inboxPaneRef.current.inert = !isDesktop && !!conversationId;
    if (threadPaneRef.current) threadPaneRef.current.inert = !isDesktop && !conversationId;
  }, [conversationId, isDesktop]);

  // Follow the usable viewport when a mobile keyboard opens or the device rotates.
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const topbar = document.querySelector('.furk-topbar');
    const updateSize = () => {
      page.style.setProperty('--chat-viewport-height', `${window.visualViewport?.height ?? window.innerHeight}px`);
      page.style.setProperty('--chat-viewport-top', `${window.visualViewport?.offsetTop ?? 0}px`);
      if (topbar) page.style.setProperty('--chat-navbar-height', `${topbar.getBoundingClientRect().height}px`);
    };
    const observer = new ResizeObserver(updateSize);
    if (topbar) observer.observe(topbar);
    window.addEventListener('resize', updateSize);
    window.visualViewport?.addEventListener('resize', updateSize);
    window.visualViewport?.addEventListener('scroll', updateSize);
    updateSize();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
      window.visualViewport?.removeEventListener('resize', updateSize);
      window.visualViewport?.removeEventListener('scroll', updateSize);
    };
  }, []);

  useEffect(() => {
    setError(false);
    if (!conversationId) return;
    const controller = new AbortController();
    if (!Number.isSafeInteger(Number(conversationId)) || Number(conversationId) <= 0) {
      setError(true);
      return;
    }
    http.get<{ success: boolean; data: Conversation }>(`/merchant-chat/get-conversation/${conversationId}`, { signal: controller.signal })
      .then(response => {
        if (!response.success || !response.data) throw new Error('Conversation unavailable');
        if (!controller.signal.aborted) setConversation(response.data);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [conversationId, retry]);

  const selectConversation = (selected: Conversation) => {
    setConversation(selected);
    navigate(`${chatBasePath}/${selected.id}`, { state: { conversation: selected } });
  };
  const backToInbox = () => navigate(chatBasePath, { replace: true });
  const transition = { duration: reduceMotion ? 0 : 0.23, ease: [0.22, 1, 0.36, 1] as const };
  const showingThread = isDesktop || !!conversationId;

  const content = (
    <motion.main
      ref={pageRef}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
      className={`${styles.page} ${isMerchant ? styles.merchantPage : styles.ownerPage}`}
      aria-label="Chat"
    >
      <div className={styles.workspace} data-conversation-open={!!conversationId}>
        <motion.aside
          ref={inboxPaneRef}
          className={styles.inboxPane}
          aria-label="Conversations"
          aria-hidden={!isDesktop && !!conversationId}
          initial={false}
          animate={{ opacity: showingThread ? (isDesktop ? 1 : 0) : 1, x: showingThread && !isDesktop ? -22 : 0 }}
          transition={transition}
        >
          <ChatSidebar isMerchant={isMerchant} selectedId={Number(conversationId)} onSelectConversation={selectConversation} activity={activity} />
        </motion.aside>
        <motion.section
          ref={threadPaneRef}
          className={styles.threadPane}
          aria-label="Conversation"
          aria-hidden={!isDesktop && !conversationId}
          initial={false}
          animate={{ opacity: showingThread ? 1 : 0, x: !showingThread && !isDesktop ? 22 : 0 }}
          transition={transition}
        >
          {conversationId ? selectedConversation ? (
            <ChatWindow key={selectedConversation.id} conversation={selectedConversation} onBack={backToInbox} onActivity={setActivity} />
          ) : (
            <div className={styles.threadState}>
              <button type="button" className={styles.textButton} onClick={backToInbox}><ArrowLeft size={18} aria-hidden="true" />Back to messages</button>
              <div className={styles.emptyState} role={error ? 'alert' : 'status'}>
                {error ? <MessageCircle size={32} aria-hidden="true" /> : <RefreshCw size={28} className={styles.spinner} aria-hidden="true" />}
                <h2>{error ? 'This conversation could not be opened' : 'Opening your conversation…'}</h2>
                {error && <><p>Please try again or choose another conversation.</p><button type="button" className={styles.primaryButton} onClick={() => setRetry(value => value + 1)}>Try again</button></>}
              </div>
            </div>
          ) : (
            <div className={styles.welcome}>
              {/* <p className={styles.eyebrow}>A little conversation. Better care.</p> */}
              <h2>{isMerchant ? 'Great care starts with a conversation' : 'Stay close to their care'}</h2>
              <p>{isMerchant ? 'Answer questions, share details, and help pet owners feel ready for their next visit.' : 'Ask your merchant a question, share your pet’s needs, or talk through your next visit.'}</p>
              <div className={styles.welcomeHint}><MessageCircle size={18} aria-hidden="true" />Choose a conversation to get started</div>
              {!isMerchant && <Link to="/merchants" className={styles.textButton}>Find a merchant<ArrowRight size={17} aria-hidden="true" /></Link>}
            </div>
          )}
        </motion.section>
      </div>
    </motion.main>
  );

  return isMerchant ? <><MerchantNavbar />{content}</> : <TopNavbarPageShell>{content}</TopNavbarPageShell>;
}
