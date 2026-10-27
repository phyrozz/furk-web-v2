export interface ResourceSnapshot<T> {
  data: T | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
}

/** Session-only cache shared by route mounts. Requests are deduplicated. */
export class CachedResource<T> {
  private snapshot: ResourceSnapshot<T> = { data: null, status: 'idle' };
  private listeners = new Set<() => void>();
  private dirty = true;
  private revision = 0;
  private session = 0;
  private pending: Promise<T> | null = null;

  constructor(private fetchData: () => Promise<T>) {}

  getSnapshot = () => this.snapshot;
  getSession = () => this.session;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private publish(snapshot: ResourceSnapshot<T>) {
    if (Object.is(this.snapshot.data, snapshot.data) && this.snapshot.status === snapshot.status) return;
    this.snapshot = snapshot;
    this.listeners.forEach(listener => listener());
  }

  set(data: T, session = this.session) {
    if (session !== this.session) return;
    this.revision += 1;
    this.dirty = false;
    this.publish({ data, status: 'ready' });
  }

  load = (): Promise<T> => {
    if (!this.dirty && this.snapshot.data !== null) return Promise.resolve(this.snapshot.data);
    if (this.pending) return this.pending;
    const session = this.session;
    if (this.snapshot.data === null) this.publish({ data: null, status: 'loading' });

    const request = Promise.resolve().then(async () => {
      try {
        while (true) {
          const revision = this.revision;
          const data = await this.fetchData();
          // An old account's request must never populate the next account's cache.
          if (session !== this.session) return data;
          if (revision !== this.revision) {
            if (!this.dirty && this.snapshot.data !== null) return this.snapshot.data;
            continue;
          }
          this.dirty = false;
          this.publish({ data, status: 'ready' });
          return data;
        }
      } catch (error) {
        if (session === this.session) this.publish({ ...this.snapshot, status: 'error' });
        throw error;
      } finally {
        if (this.pending === request) this.pending = null;
      }
    });
    this.pending = request;
    return request;
  };

  invalidate() {
    this.revision += 1;
    this.dirty = true;
    // With no consumers, defer fetching until the next mount.
    if (this.listeners.size > 0) void this.load().catch(error => console.error('Account summary refresh failed:', error));
  }

  reset() {
    this.session += 1;
    this.revision += 1;
    this.dirty = true;
    this.pending = null;
    this.publish({ data: null, status: 'idle' });
  }
}
