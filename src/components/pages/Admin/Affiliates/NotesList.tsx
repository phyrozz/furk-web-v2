import { useState, useCallback, useRef } from 'react';
import { http } from '../../../../utils/http';
import DateUtils from '../../../../utils/date-utils';
import { useLazyLoad } from '../../../../hooks/useLazyLoad';

interface Note {
  id: string;
  application_id: string;
  notes: string;
  created_at: string;
}

interface NotesListProps {
  applicationId: number;
  refreshKey?: number;
}

const NotesList: React.FC<NotesListProps> = ({ applicationId, refreshKey }) => {
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  const fetchNotes = async (limit: number, offset: number) => {
    try {
      const response = await http.post<{ data: Note[] }>(
        `/affiliate-application/list-notes/${applicationId}`,
        { limit, offset }
      );

      if (!response || !response.data) {
        throw new Error('Invalid response format');
      }

      return response.data;
    } catch (err: any) {
      setError('Failed to fetch notes: ' + (err.message || 'Unknown error'));
      console.error('Error fetching notes:', err);
      return [];
    }
  };

  const { items: notes, loading, hasMore, loadMore, reset } = useLazyLoad<Note>({
    fetchData: fetchNotes,
    limit,
    dependencies: [applicationId, refreshKey],
  });

  const observer = useRef<IntersectionObserver>();
  const lastNoteElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMore]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div 
        className="divide-y max-h-[500px] overflow-y-auto"
      >
        {error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notes added yet
          </div>
        ) : (
          notes.map((note, index) => (
            <div 
              key={note.id} 
              ref={index === notes.length - 1 ? lastNoteElementRef : undefined}
              className="p-4"
            >
              <div className="flex flex-col w-full">
                <p className="text-gray-900 whitespace-pre-wrap w-full">{note.notes}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {DateUtils.formatRelativeTime(note.created_at)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {DateUtils.formatTimestampString(note.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="p-4 text-center">
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce" />
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce delay-100" />
              <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce delay-200" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesList;
