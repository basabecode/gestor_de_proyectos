import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, MoreVertical, Edit3, Copy, Trash2, FolderOpen, Grid3X3, List } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui';
import useBoardStore from '../stores/boardStore';
import useUIStore from '../stores/uiStore';
import { Guard } from '../components/auth/Guard';
import { cn, formatRelativeDate } from '../lib/utils';

export default function BoardsListPage() {
  const navigate = useNavigate();
  const { boards, deleteBoard, duplicateBoard } = useBoardStore();
  const { openModal } = useUIStore();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const filtered = boards.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Tableros" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tableros..."
                className="pl-9 pr-4 py-2 w-full sm:w-64 text-[13px] rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex bg-surface-secondary rounded-lg p-0.5 border border-border-light shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={cn('p-1.5 rounded', viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-surface-hover')}
              >
                <List className="w-4 h-4 text-text-secondary" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-1.5 rounded', viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-surface-hover')}
              >
                <Grid3X3 className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          </div>
          <Guard action="create:board">
            <Button onClick={() => openModal('createBoard')} icon={Plus}>Nuevo tablero</Button>
          </Guard>
        </div>

        {boards.length === 0 ? (
          <div className="bg-white rounded-xl p-16 shadow-[--shadow-sm] border border-border-light text-center animate-fade-in">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-[18px] font-bold text-text-primary mb-2">Crea tu primer tablero</h3>
            <p className="text-[13px] text-text-secondary max-w-md mx-auto mb-6">
              Los tableros te permiten organizar tu trabajo con columnas personalizables,
              vistas múltiples y automatizaciones. Comienza con una plantilla o desde cero.
            </p>
            <Button onClick={() => openModal('createBoard')} icon={Plus} size="md">Crear tablero</Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((board) => {
              const itemCount = board.items.length;
              const doneCount = board.items.filter((i) => i.columnValues?.status === 'done').length;
              const progress = itemCount > 0 ? Math.round((doneCount / itemCount) * 100) : 0;
              return (
                <div
                  key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="bg-white rounded-lg p-4 shadow-[--shadow-sm] border border-border-light hover:shadow-[--shadow-md] cursor-pointer transition-all group relative"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-primary shrink-0" />
                      <h4 className="text-[14px] font-semibold text-text-primary group-hover:text-primary transition-colors">{board.name}</h4>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === board.id ? null : board.id); }}
                      className="p-1 hover:bg-surface-hover rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                  {board.description && (
                    <p className="text-[12px] text-text-secondary mb-3 line-clamp-2">{board.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-text-disabled mb-3">
                    <span>{itemCount} elementos</span>
                    <span>{board.groups.length} grupos</span>
                  </div>
                  <div className="w-full bg-surface-secondary rounded-full h-1.5">
                    <div className="bg-status-green h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-text-disabled">{formatRelativeDate(board.updatedAt)}</span>
                    <span className="text-[10px] font-medium text-text-secondary">{progress}%</span>
                  </div>
                  {menuOpen === board.id && <BoardMenu board={board} onClose={() => setMenuOpen(null)} openModal={openModal} duplicateBoard={duplicateBoard} deleteBoard={deleteBoard} />}
                </div>
              );
            })}
            <div
              onClick={() => openModal('createBoard')}
              className="bg-white rounded-lg p-4 shadow-[--shadow-sm] border border-dashed border-border hover:border-primary hover:shadow-[--shadow-md] cursor-pointer transition-all flex items-center justify-center min-h-[140px]"
            >
              <div className="text-center">
                <Plus className="w-8 h-8 text-text-disabled mx-auto mb-1" />
                <span className="text-[13px] text-text-secondary">Nuevo tablero</span>
              </div>
            </div>
            {filtered.length === 0 && boards.length > 0 && (
              <div className="col-span-full text-center py-10 text-[13px] text-text-disabled">
                No se encontraron tableros que coincidan con "{search}"
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-[--shadow-sm] border border-border-light overflow-hidden board-table-scroll">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-surface-secondary border-b border-border-light">
                  <th className="text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Nombre</th>
                  <th className="text-center text-[11px] font-semibold text-text-secondary uppercase tracking-wider px-4 py-3 w-[100px]">Elementos</th>
                  <th className="text-center text-[11px] font-semibold text-text-secondary uppercase tracking-wider px-4 py-3 w-[100px]">Grupos</th>
                  <th className="text-center text-[11px] font-semibold text-text-secondary uppercase tracking-wider px-4 py-3 w-[120px]">Progreso</th>
                  <th className="text-center text-[11px] font-semibold text-text-secondary uppercase tracking-wider px-4 py-3 w-[140px]">Actualizado</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((board) => {
                  const itemCount = board.items.length;
                  const doneCount = board.items.filter((i) => i.columnValues?.status === 'done').length;
                  const progress = itemCount > 0 ? Math.round((doneCount / itemCount) * 100) : 0;
                  return (
                    <tr
                      key={board.id}
                      className="border-b border-border-light hover:bg-surface-secondary/50 cursor-pointer group transition-colors"
                      onClick={() => navigate(`/board/${board.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <LayoutGrid className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <span className="text-[14px] font-medium text-text-primary">{board.name}</span>
                            {board.description && (
                              <p className="text-[12px] text-text-secondary mt-0.5 truncate max-w-[300px]">{board.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-[13px] text-text-secondary">{itemCount}</td>
                      <td className="px-4 py-3 text-center text-[13px] text-text-secondary">{board.groups.length}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-surface-secondary rounded-full h-1.5">
                            <div className="bg-status-green h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[11px] text-text-secondary w-8 text-right">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-[12px] text-text-secondary">{formatRelativeDate(board.updatedAt)}</td>
                      <td className="px-2 py-3">
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === board.id ? null : board.id); }}
                            className="p-1 hover:bg-surface-hover rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4 text-text-secondary" />
                          </button>
                          {menuOpen === board.id && <BoardMenu board={board} onClose={() => setMenuOpen(null)} openModal={openModal} duplicateBoard={duplicateBoard} deleteBoard={deleteBoard} />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-text-disabled">
                      {boards.length === 0 ? 'No hay tableros' : `No se encontraron tableros que coincidan con "${search}"`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BoardMenu({ board, onClose, openModal, duplicateBoard, deleteBoard }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20">
        <Guard action="edit:board">
          <button
            onClick={(e) => { e.stopPropagation(); openModal('editBoard', board); onClose(); }}
            className="w-full px-3 py-2 text-left text-[13px] text-text-primary hover:bg-surface-secondary flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> Editar
          </button>
        </Guard>
        <Guard action="create:board">
          <button
            onClick={(e) => { e.stopPropagation(); duplicateBoard(board.id); onClose(); }}
            className="w-full px-3 py-2 text-left text-[13px] text-text-primary hover:bg-surface-secondary flex items-center gap-2"
          >
            <Copy className="w-4 h-4" /> Duplicar
          </button>
        </Guard>
        <Guard action="delete:board">
          <hr className="my-1 border-border-light" />
          <button
            onClick={(e) => { e.stopPropagation(); deleteBoard(board.id); onClose(); }}
            className="w-full px-3 py-2 text-left text-[13px] text-status-red hover:bg-status-red-light flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </Guard>
      </div>
    </>
  );
}
