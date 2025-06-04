import { useState, useEffect } from 'react';

interface LazyLoadOptions<T> {
  fetchData: (limit: number, offset: number, keyword: string) => Promise<T[]>;
  limit?: number;
  keyword?: string;
  dependencies?: any[];
}

export const useLazyLoad = <T>({
  fetchData,
  limit = 10,
  keyword = '',
  dependencies = []
}: LazyLoadOptions<T>) => {
  const [items, setItems] = useState<T[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newItems = await fetchData(limit, offset, keyword);
      setItems((prev) => [...prev, ...newItems]);
      setOffset((prev) => prev + limit);
      if (newItems.length < limit) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load items', error);
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    setLoading(true);
    try {
      const newItems = await fetchData(limit, 0, keyword);
      setItems(newItems);
      setOffset(limit);
      if (newItems.length < limit) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load items', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reset();
  }, [keyword, ...dependencies]);

  return { items, loadMore, loading, hasMore, reset };
};
