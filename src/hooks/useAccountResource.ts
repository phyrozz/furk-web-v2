import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { CachedResource, ResourceSnapshot } from '../services/account-summary/cached-resource';

const emptySnapshot = { data: null, status: 'idle' } as const;

export function useAccountResource<T>(resource: CachedResource<T>, enabled = true): ResourceSnapshot<T> {
  const subscribe = useCallback((listener: () => void) => enabled ? resource.subscribe(listener) : () => {}, [resource, enabled]);
  const getSnapshot = useCallback(() => enabled ? resource.getSnapshot() : emptySnapshot, [resource, enabled]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    if (enabled) void resource.load().catch(error => console.error('Failed to load account summary:', error));
  }, [resource, enabled]);

  return snapshot;
}
