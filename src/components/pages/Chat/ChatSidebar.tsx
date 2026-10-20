import { useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageCircle, RefreshCw, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useChatInbox } from './useChatInbox';
import { formatInboxTime, getConversationName, searchConversations, type ChatActivity, type Conversation } from './chat-utils';
import ChatAvatar from './ChatAvatar';
import styles from './Chat.module.css';

interface Props {
  isMerchant: boolean;
  selectedId?: number;
  onSelectConversation: (conversation: Conversation) => void;
  activity?: ChatActivity;
}

export default function ChatSidebar({ isMerchant, selectedId, onSelectConversation, activity }: Props) {
  const [search, setSearch] = useState('');
  const [query] = useDebounce(search, 250);
  const { conversations, loading, error, hasMore, loadMore, refresh } = useChatInbox(activity);
  const searchRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const visibleConversations = searchConversations(conversations, query, isMerchant);

  useEffect(() => {
    if (!selectedId && window.matchMedia('(max-width: 767px)').matches) headingRef.current?.focus({ preventScroll: true });
  }, [selectedId]);

  // The existing list endpoint does not filter searches. Search successive pages locally.
  useEffect(() => {
    if (query.trim() && hasMore && !loading && !error) void loadMore();
  }, [query, hasMore, loading, error, loadMore]);

  return (
    <div className={styles.inbox}>
      <header className={styles.inboxHeader}>
        <div className={styles.inboxTitleRow}>
          <div>
            <h1 ref={headingRef} tabIndex={-1}>Messages</h1>
            {/* <p>{isMerchant ? 'A personal touch for every pet owner.' : 'Good care starts with a conversation.'}</p> */}
          </div>
          <button type="button" onClick={refresh} className={styles.iconButton} disabled={loading} aria-label="Refresh conversations" title="Refresh conversations">
            <RefreshCw size={19} className={loading ? styles.spinner : ''} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <input ref={searchRef} type="search" value={search} onChange={event => setSearch(event.target.value)} aria-label="Search conversations" placeholder={isMerchant ? 'Search pet owners or messages' : 'Search merchants or messages'} />
          {search && <button type="button" onClick={() => { setSearch(''); searchRef.current?.focus(); }} aria-label="Clear conversation search"><X size={17} aria-hidden="true" /></button>}
        </div>
      </header>
      <div className={styles.inboxList} aria-busy={loading}>
        {error && <div className={styles.inlineError} role="alert"><p>We couldn’t load your conversations.</p><button type="button" className={styles.textButton} onClick={refresh}>Try again</button></div>}
        {!loading && !error && visibleConversations.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}><MessageCircle size={27} aria-hidden="true" /></span>
            <h2>{query.trim() ? 'No matching conversations' : 'Your conversations start here'}</h2>
            <p>{query.trim() ? 'Try another name or a word from a message.' : isMerchant ? 'When a pet owner messages your business, you can reply here.' : 'Have a question? Open a merchant’s profile and choose Chat to start talking.'}</p>
            {query.trim() ? <button type="button" className={styles.textButton} onClick={() => setSearch('')}>Clear search</button>
              : !isMerchant && <Link to="/merchants" className={styles.primaryButton}>Find a merchant<ArrowRight size={17} aria-hidden="true" /></Link>}
          </div>
        )}
        <ul className={styles.conversations} aria-label="Conversation list">
          {visibleConversations.map(conversation => {
            const name = getConversationName(conversation, isMerchant);
            const active = selectedId === conversation.id;
            return (
              <li key={conversation.id}>
                <button type="button" className={styles.conversation} aria-current={active ? 'true' : undefined} onClick={() => onSelectConversation(conversation)}>
                  <ChatAvatar
                    name={name}
                    imageUrl={isMerchant ? conversation.pet_owner_image_url : conversation.merchant_image_url}
                  />
                  <span className={styles.conversationCopy}>
                    <span className={styles.conversationTop}><span className={styles.conversationName}>{name}</span><time dateTime={conversation.last_message_created_at || undefined}>{formatInboxTime(conversation.last_message_created_at)}</time></span>
                    <span className={styles.preview}>{conversation.last_message_content || 'Say hello and start the conversation'}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {loading && <div className={styles.listLoading} role="status"><RefreshCw size={17} className={styles.spinner} aria-hidden="true" />{query.trim() ? 'Searching conversations…' : 'Loading conversations…'}</div>}
        {hasMore && !query.trim() && !error && <button type="button" className={styles.loadMore} onClick={() => void loadMore()} disabled={loading}>Load more conversations</button>}
      </div>
    </div>
  );
}
