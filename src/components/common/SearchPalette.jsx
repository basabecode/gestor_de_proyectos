import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, FileText, ArrowRight, Briefcase, Loader2 } from 'lucide-react';
import useUIStore from '../../stores/uiStore';
import useBoardStore from '../../stores/boardStore';
import usePortfolioStore from '../../stores/portfolioStore';
import useWorkspaceStore from '../../stores/workspaceStore';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { STATUS_COLORS } from '../../lib/constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  board:     { icon: LayoutGrid, label: 'Tablero',   iconCls: 'text-primary',        bgCls: 'bg-primary/10' },
  item:      { icon: FileText,   label: 'Elemento',  iconCls: 'text-text-secondary',  bgCls: 'bg-surface-secondary' },
  portfolio: { icon: Briefcase,  label: 'Portafolio', iconCls: 'text-status-purple',  bgCls: 'bg-status-purple-light' },
};

function buildRecentBoards(boards) {
  return boards.slice(0, 6).map((b) => ({
    type:    'board',
    id:      b.id,
    title:   b.name,
    subtitle: `${b.items.length} elementos · ${b.groups.length} grupos`,
    boardId: b.id,
  }));
}

function buildLocalResults(query, boards, portfolios) {
  const q = query.toLowerCase();
  const items = [];

  boards.forEach((board) => {
    if (board.name.toLowerCase().includes(q) || board.description?.toLowerCase().includes(q)) {
      items.push({ type: 'board', id: board.id, title: board.name,
        subtitle: board.description || `${board.items.length} elementos`, boardId: board.id });
    }
    board.items.forEach((item) => {
      if (item.title.toLowerCase().includes(q)) {
        items.push({ type: 'item', id: item.id, title: item.title,
          subtitle: `en ${board.name}`, boardId: board.id,
          statusColor: STATUS_COLORS[item.columnValues?.status]?.bg });
      }
    });
  });

  portfolios.forEach((p) => {
    if (p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) {
      items.push({ type: 'portfolio', id: p.id, title: p.name,
        subtitle: p.description || 'Portafolio', boardId: null });
    }
  });

  return items.slice(0, 12);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SearchPalette() {
  const navigate   = useNavigate();
  const { searchOpen, closeSearch } = useUIStore();
  const { boards }     = useBoardStore();
  const { portfolios } = usePortfolioStore();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const [query, setQuery]           = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dbResults, setDbResults]   = useState(null);   // null = sin búsqueda DB todavía
  const [loading, setLoading]       = useState(false);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);
  const listRef     = useRef(null);

  // Abrir con Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().openSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Reset al abrir
  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setDbResults(null);
      setSelectedIndex(0);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Búsqueda en Supabase (FTS) con debounce
  const searchSupabase = useCallback(async (q) => {
    if (!activeWorkspaceId || q.length < 2) {
      setDbResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_workspace', {
        search_query: q,
        ws_id:        activeWorkspaceId,
      });

      if (error) throw error;

      setDbResults(
        (data || []).map((row) => ({
          type:     row.result_type,
          id:       row.result_id,
          title:    row.title,
          subtitle: row.subtitle,
          boardId:  row.board_id,
        }))
      );
    } catch {
      setDbResults(null); // fallback a resultados locales
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  // Disparar búsqueda DB con debounce 300ms
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setDbResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => searchSupabase(query.trim()), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchSupabase]);

  // Resultados a mostrar: DB si disponibles, si no locales
  const results = useMemo(() => {
    if (!query.trim()) return buildRecentBoards(boards);
    if (dbResults !== null) return dbResults.slice(0, 12);
    return buildLocalResults(query, boards, portfolios);
  }, [query, dbResults, boards, portfolios]);

  // Secciones agrupadas
  const sections = useMemo(() => {
    if (!query.trim()) return [{ label: 'Recientes', items: results }];
    const byType = {};
    results.forEach((r) => {
      if (!byType[r.type]) byType[r.type] = [];
      byType[r.type].push(r);
    });
    return Object.entries(byType).map(([type, items]) => ({
      label: TYPE_CONFIG[type]?.label + 's' || type,
      items,
    }));
  }, [results, query]);

  const flatResults = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  useEffect(() => setSelectedIndex(0), [query]);

  const handleSelect = useCallback((result) => {
    if (result.type === 'portfolio') {
      navigate(`/portfolio/${result.id}`);
    } else {
      navigate(`/board/${result.boardId}`);
    }
    closeSearch();
  }, [navigate, closeSearch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) handleSelect(flatResults[selectedIndex]);
    }
  };

  // Scroll del elemento seleccionado
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!searchOpen) return null;

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 animate-fade-in"
      onClick={closeSearch}
    >
      <div
        className="w-full max-w-140 bg-white rounded-xl shadow-[--shadow-dialog] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light">
          {loading
            ? <Loader2 className="w-5 h-5 text-primary shrink-0 animate-spin" />
            : <Search className="w-5 h-5 text-text-disabled shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar tableros, elementos, portafolios..."
            className="flex-1 text-[15px] outline-none placeholder:text-text-disabled"
          />
          <kbd className="text-[10px] text-text-disabled bg-surface-secondary px-1.5 py-0.5 rounded border border-border-light">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-100 overflow-y-auto py-1">
          {flatResults.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-text-disabled">
                {loading ? 'Buscando...' : query ? 'Sin resultados' : 'Escribe para buscar...'}
              </p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.label}>
                <div className="px-4 py-1.5">
                  <span className="text-[10px] font-semibold text-text-disabled uppercase tracking-wider">
                    {section.label}
                  </span>
                </div>
                {section.items.map((result) => {
                  const idx = globalIdx++;
                  const cfg = TYPE_CONFIG[result.type] || TYPE_CONFIG.item;
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      data-idx={idx}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        idx === selectedIndex ? 'bg-primary/8' : 'hover:bg-surface-secondary'
                      )}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className={cn('w-8 h-8 rounded-md flex items-center justify-center shrink-0', cfg.bgCls)}>
                        <Icon className={cn('w-4 h-4', cfg.iconCls)} />
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
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border-light flex items-center gap-4 text-[10px] text-text-disabled">
          <span className="flex items-center gap-1">
            <kbd className="bg-surface-secondary px-1 rounded">↑↓</kbd> navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-surface-secondary px-1 rounded">↵</kbd> abrir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-surface-secondary px-1 rounded">esc</kbd> cerrar
          </span>
          {dbResults !== null && (
            <span className="ml-auto text-[9px] text-primary font-medium">
              Búsqueda en base de datos
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
