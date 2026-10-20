import { useCallback, useEffect, useRef, useState } from 'react';
import { http } from '../../../utils/http';
import { subscribe } from '../../../utils/websockets';
import { updateConversationPreview, type ChatActivity, type Conversation } from './chat-utils';

const PAGE_SIZE = 50;

export function useChatInbox(activity?: ChatActivity) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [revision, setRevision] = useState(0);
  const offset = useRef(0);
  const busy = useRef(false);
  const generation = useRef(0);
  const request = useRef<AbortController>();
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const loadPage = useCallback(async (replace = false) => {
    if (busy.current) return;
    busy.current = true;
    const version = generation.current;
    const pageOffset = replace ? 0 : offset.current;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(false);
    try {
      const response = await http.post<{ success: boolean; data: Conversation[]; count?: number }>(
        '/merchant-chat/list-conversations',
        { limit: PAGE_SIZE, offset: pageOffset },
        { signal: controller.signal }
      );
      if (version !== generation.current) return;
      if (!response.success || !Array.isArray(response.data)) throw new Error('Inbox unavailable');
      setConversations(previous => {
        const updated = replace ? response.data : [...previous, ...response.data];
        return updated.filter((item, index) => updated.findIndex(other => other.id === item.id) === index);
      });
      offset.current = pageOffset + response.data.length;
      setHasMore(response.count !== undefined ? offset.current < response.count : response.data.length === PAGE_SIZE);
    } catch {
      if (version === generation.current && !controller.signal.aborted) setError(true);
    } finally {
      if (version === generation.current) {
        busy.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    generation.current += 1;
    busy.current = false;
    void loadPage(true);
    return () => {
      generation.current += 1;
      request.current?.abort();
    };
  }, [revision, loadPage]);

  const applyActivity = useCallback((next: ChatActivity) => {
    if (!conversationsRef.current.some(item => item.id === next.conversation_id)) {
      setRevision(value => value + 1);
      return;
    }
    setConversations(previous => updateConversationPreview(previous, next));
  }, []);

  useEffect(() => {
    if (activity) applyActivity(activity);
  }, [activity, applyActivity]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void subscribe((event: { event?: string; conversation_id?: number; content?: string; created_at?: string }) => {
      if (active && event.event === 'new_message' && event.conversation_id && typeof event.content === 'string') {
        applyActivity({
          conversation_id: Number(event.conversation_id),
          content: event.content,
          created_at: event.created_at || new Date().toISOString(),
        });
      }
    }).then(cleanup => {
      if (active) unsubscribe = cleanup;
      else cleanup();
    });
    return () => { active = false; unsubscribe?.(); };
  }, [applyActivity]);

  return { conversations, loading, error, hasMore, loadMore: loadPage, refresh: () => setRevision(value => value + 1) };
}
