import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface MultipleAutocompleteProps<T> {
  options: T[];
  values: T[];
  onChange: (values: T[]) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue?: (option: T) => string | number;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  onSearch?: (query: string, offset?: number) => Promise<void>;
  onLoadMore?: (query: string, offset: number) => Promise<void>;
  hasMore?: boolean;
  debounceMs?: number;
  maxSelections?: number;
}

const MultipleAutocomplete = <T extends object>({
  options,
  values,
  onChange,
  getOptionLabel,
  getOptionValue = (option: T) => getOptionLabel(option),
  placeholder = 'Search...',
  className = '',
  isLoading = false,
  onSearch,
  onLoadMore,
  hasMore = false,
  debounceMs = 300,
  maxSelections
}: MultipleAutocompleteProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollPosition = useRef<number>(0);

  // Filter out options that are already selected
  const filteredOptions = options.filter(
    (option) => !values.some(
      (value) => getOptionValue(value) === getOptionValue(option)
    )
  );

  const debouncedSearch = useCallback(
    async (query: string, searchOffset: number = 0) => {
      if (onSearch) {
        try {
          await onSearch(query, searchOffset);
        } catch (error) {
          console.error('Search error:', error);
        }
      }
    },
    [onSearch]
  );

  useEffect(() => {
    const handleScroll = async () => {
      if (!dropdownRef.current || !onLoadMore || !hasMore || isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = dropdownRef.current;
      const scrollThreshold = scrollHeight - scrollTop - clientHeight;
      
      if (scrollThreshold <= 50) {
        lastScrollPosition.current = scrollTop;
        const newOffset = offset + filteredOptions.length;
        await onLoadMore(searchTerm, newOffset);
        setOffset(newOffset);
      }
    };

    const dropdown = dropdownRef.current;
    if (dropdown) {
      dropdown.addEventListener('scroll', handleScroll);
      return () => dropdown.removeEventListener('scroll', handleScroll);
    }
  }, [onLoadMore, hasMore, isLoading, filteredOptions.length, offset, searchTerm]);

  // Add effect to restore scroll position after options update
  useEffect(() => {
    if (dropdownRef.current && lastScrollPosition.current > 0) {
      dropdownRef.current.scrollTop = lastScrollPosition.current;
      // Reset the stored position after restoring
      lastScrollPosition.current = 0;
    }
  }, [filteredOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click target is a valid Element
      const target = event.target as Element;
      
      // Check if the click is outside both the wrapper and dropdown
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    // Add the event listener to the document
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    setOffset(0);
    lastScrollPosition.current = 0;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      debouncedSearch(value, 0);
    }, debounceMs);
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Fetch initial options if needed
    if (searchTerm) {
      debouncedSearch(searchTerm, offset);
    } else if (onSearch) {
      debouncedSearch('', 0);
    }
  };

  const handleRemoveValue = (valueToRemove: T) => {
    const newValues = values.filter(
      (value) => getOptionValue(value) !== getOptionValue(valueToRemove)
    );
    onChange(newValues);
  };

  const handleSelectOption = (option: T) => {
    // Check if we've reached the maximum number of selections
    if (maxSelections && values.length >= maxSelections) {
      return;
    }
    
    const newValues = [...values, option];
    onChange(newValues);
    setSearchTerm('');
    // Keep the dropdown open for more selections
    setIsOpen(true);
    // Focus the input after selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const reachedMaxSelections = maxSelections ? values.length >= maxSelections : false;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative bg-white border border-gray-300 rounded-lg p-1 flex flex-wrap items-center focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
        {/* Selected values as tags/chips */}
        {values.map((value, index) => (
          <div 
            key={index} 
            className="flex items-center bg-gray-100 rounded-md m-1 px-2 py-1 text-sm"
          >
            <span>{getOptionLabel(value)}</span>
            <button
              type="button"
              className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => handleRemoveValue(value)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {/* Input field */}
        <div className="flex-grow flex items-center min-w-[120px]">
          <Search className="ml-2 text-gray-400" size={18} />
          <input
            ref={inputRef}
            type="text"
            className="w-full pl-2 py-2 border-none focus:outline-none focus:ring-0"
            placeholder={reachedMaxSelections ? `Maximum ${maxSelections} items selected` : placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleFocus}
            disabled={reachedMaxSelections}
          />
        </div>
      </div>

      {isOpen && !reachedMaxSelections && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.map((option, index) => (
                <div
                  key={index}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectOption(option)}
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

export default MultipleAutocomplete;