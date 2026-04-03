import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchBarProps {
  onSearch: (ticker: string) => void;
  loading: boolean;
  className?: string;
}

const POPULAR_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'BRK-B', 'JPM', 'V'];

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading, className = '' }) => {
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (ticker) onSearch(ticker);
  };

  const handleChip = (ticker: string) => {
    setValue(ticker);
    onSearch(ticker);
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder={t.search.placeholder}
            className="w-full pl-12 pr-32 py-3.5 bg-white border border-gray-300 text-gray-900
                       text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent
                       placeholder-gray-400 transition-colors duration-150 font-mono uppercase tracking-widest"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={!value.trim() || loading}
            className="absolute right-2 btn-primary py-2 px-4 flex items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.search.loading}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{t.search.analyze}</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        <span className="text-xs text-gray-400 self-center mr-1">{t.search.try}</span>
        {POPULAR_TICKERS.map((ticker) => (
          <button
            key={ticker}
            onClick={() => handleChip(ticker)}
            disabled={loading}
            className="px-2.5 py-1 text-xs font-mono font-medium bg-white border border-gray-200
                       text-gray-500 hover:text-gray-900 hover:border-gray-400
                       rounded-md transition-colors duration-150 disabled:opacity-40"
          >
            {ticker}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
