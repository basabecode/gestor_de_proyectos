import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, FileText, ArrowRight, Hash } from 'lucide-react';
import useUIStore from '../../stores/uiStore';
import useBoardStore from '../../stores/boardStore';
import { cn } from '../../lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '../../lib/constants';

export default function SearchPalette() {
  const navigate = useNavigate();
  const { searchOpen, closeSearch } = useUIStore();
  const { boards } = useBoardStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Listen for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Build search results
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show recent boards when no query
      return boards.slice(0, 5).map((b) => ({
        type: 'board',
        id: b.id,
        title: b.name,
        subtitle: `${b.items.length} elementos · ${b.groups.length} grupos`,
        icon: LayoutGrid,
        action: () => navigate(`/board/${b.id}`),
      }));
    }

    const q = query.toLowerCase();
    const items = [];

    // Search boards
    boards.forEach((board) => {
      if (board.name.toLowerCase().includes(q) || board.description?.toLowerCase().includes(q)) {
        items.push({
          type: 'board',
          id: board.id,
          title: board.name,
          subtitle: board.description || `${board.items.length} elementos`,
          icon: LayoutGrid,
          action: () => navigate(`/board/${board.id}`),
        });
      }

      // Search items within boards
      board.items.forEach((item) => {
        if (item.title.toLowerCase().includes(q)) {
          const status = item.columnValues?.status;
          items.push({
            type: 'item',
            id: item.id,
            title: item.title,
            subtitle: `en ${board.name}`,
            icon: FileText,
            statusColor: STATUS_COLORS[status]?.bg,
            action: () => navigate(`/board/${board.id}`),
          });
        }
      });
    });

    return items.slice(0, 10);
  }, [query, boards, navigate]);

  // Keyboard navigation
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
        closeSearch();
      }
    }
  };

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!searchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 animate-fade-in"
      onClick={closeSearch}
    >
      <div
        className="w-full max-w-[560px] bg-white rounded-xl shadow-[--shadow-dialog] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light">
          <Search className="w-5 h-5 text-text-disabled shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar tableros, elementos..."
            className="flex-1 text-[15px] outline-none placeholder:text-text-disabled"
          />
          <kbd className="text-[10px] text-text-disabled bg-surface-secondary px-1.5 py-0.5 rounded border border-border-light">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-text-disabled">
                {query ? 'Sin resultados' : 'Escribe para buscar...'}
              </p>
            </div>
          ) : (
            <>
              {!query && (
                <div className="px-4 py-1.5">
                  <span className="text-[10px] font-semibold text-text-disabled uppercase tracking-wider">Recientes</span>
                </div>
              )}
              {results.map((result, idx) => {
                const Icon = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      idx === selectedIndex ? 'bg-primary/8' : 'hover:bg-surface-secondary'
                    )}
                    onClick={() => { result.action(); closeSearch(); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
                      result.type === 'board' ? 'bg-primary/10' : 'bg-surface-secondary'
                    )}>
                      <Icon className={cn('w-4 h-4', result.type === 'board' ? 'text-primary' : 'text-text-secondary')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-text-primary truncate">{result.title}</p>
                      <p className="text-[11px] text-text-disabled truncate">{result.subtitle}</p>
                    </div>
                    {result.statusColor && (
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: result.statusColor }} />
                    )}
                    {idx === selectedIndex && (
                      <ArrowRight className="w-3.5 h-3.5 text-text-disabled shrink-0" />
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border-light flex items-center gap-4 text-[10px] text-text-disabled">
          <span className="flex items-center gap-1"><kbd className="bg-surface-secondary px-1 rounded">↑↓</kbd> navegar</span>
          <span className="flex items-center gap-1"><kbd className="bg-surface-secondary px-1 rounded">↵</kbd> abrir</span>
          <span className="flex items-center gap-1"><kbd className="bg-surface-secondary px-1 rounded">esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}
