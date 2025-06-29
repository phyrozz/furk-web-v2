import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';

interface AutocompleteProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  getOptionLabel: (option: T) => string;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  onSearch?: (query: string, offset?: number) => Promise<void>;
  onLoadMore?: (query: string, offset: number) => Promise<void>;
  hasMore?: boolean;
  debounceMs?: number;
  disabled?: boolean;
}

const Autocomplete = <T extends object>({
  options,
  value,
  onChange,
  getOptionLabel,
  placeholder = 'Search...',
  className = '',
  isLoading = false,
  onSearch,
  onLoadMore,
  hasMore = false,
  debounceMs = 300,
  disabled = false
}: AutocompleteProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollPosition = useRef<number>(0);

  const debouncedSearch = useCallback(
    async (query: string, searchOffset: number = 0) => {
      if (onSearch && !disabled) {
        try {
          await onSearch(query, searchOffset);
        } catch (error) {
          console.error('Search error:', error);
        }
      }
    },
    [onSearch, disabled]
  );

  useEffect(() => {
    const handleScroll = async () => {
      if (!dropdownRef.current || !onLoadMore || !hasMore || isLoading || disabled) return;

      const { scrollTop, scrollHeight, clientHeight } = dropdownRef.current;
      const scrollThreshold = scrollHeight - scrollTop - clientHeight;
      
      if (scrollThreshold <= 50) {
        lastScrollPosition.current = scrollTop;
        const newOffset = offset + options.length;
        await onLoadMore(searchTerm, newOffset);
        setOffset(newOffset);
      }
    };

    const dropdown = dropdownRef.current;
    if (dropdown) {
      dropdown.addEventListener('scroll', handleScroll);
      return () => dropdown.removeEventListener('scroll', handleScroll);
    }
  }, [onLoadMore, hasMore, isLoading, options.length, offset, searchTerm, disabled]);

  useEffect(() => {
    if (dropdownRef.current && lastScrollPosition.current > 0) {
      dropdownRef.current.scrollTop = lastScrollPosition.current;
      lastScrollPosition.current = 0;
    }
  }, [options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    setOffset(0);
    lastScrollPosition.current = 0;
    
    if (!value) {
      onChange(null);
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      debouncedSearch(value, 0);
    }, debounceMs);
  };

  const handleFocus = () => {
    if (disabled) return;
    
    setIsOpen(true);
    if (!value && searchTerm) {
      debouncedSearch(searchTerm, offset);
    } else if (!value && !searchTerm && onSearch) {
      debouncedSearch('', 0);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
          }`}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleFocus}
          disabled={disabled}
        />
        <Search className={`absolute left-3 top-2.5 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} size={20} />
      </div>

      {isOpen && !disabled && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {options.length > 0 ? (
            <>
              {options.map((option, index) => (
                <div
                  key={index}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setSearchTerm(getOptionLabel(option));
                    setOffset(0);
                  }}
                >
                  {getOptionLabel(option)}
                </div>
              ))}
              {isLoading && hasMore && (
                <div className="p-2 text-center text-sm text-gray-500">
                  Loading...
                </div>
              )}
              {!isLoading && hasMore && (
                <div className="p-2 text-center text-sm text-gray-500">
                  Scroll for more...
                </div>
              )}
            </>
          ) : isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="p-4 text-center text-gray-500">No options found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Autocomplete;