import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, FolderGit2, MoreVertical, Edit3, Trash2, ChevronRight } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui';
import usePortfolioStore from '../stores/portfolioStore';
import useWorkspaceStore from '../stores/workspaceStore';
import { Guard } from '../components/auth/Guard';

// ── Inline create/edit modal ──────────────────────────────────────────────────

function PortfolioModal({ initial, onSave, onClose }) {
  const [name, setName]        = useState(initial?.name        || '');
  const [desc, setDesc]        = useState(initial?.description || '');
  const [color, setColor]      = useState(initial?.color       || '#579bfc');
  const [error, setError]      = useState('');
  const [saving, setSaving]    = useState(false);

  const COLORS = ['#579bfc','#00c875','#e2445c','#ff642e','#fdab3d','#9d50dd','#66ccff','#cab641'];

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true);
    await onSave({ name: name.trim(), description: desc.trim(), color });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <h2 className="text-[16px] font-bold text-text-primary mb-5">
          {initial ? 'Editar portafolio' : 'Nuevo portafolio'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Nombre *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Ej. Iniciativas 2025"
              className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {error && <p className="text-[11px] text-status-red mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Descripción</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="Descripción opcional..."
              className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : initial ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { portfolios, loading, createPortfolio, updatePortfolio, deletePortfolio } = usePortfolioStore();
  const { activeWorkspaceId } = useWorkspaceStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing]       = useState(null);   // portfolio object
  const [menuOpen, setMenuOpen]     = useState(null);   // portfolio id

  const handleCreate = async (data) => {
    await createPortfolio({ ...data, workspace_id: activeWorkspaceId });
    setShowCreate(false);
  };

  const handleUpdate = async (data) => {
    await updatePortfolio(editing.id, data);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este portafolio? Se eliminarán también sus programas.')) return;
    await deletePortfolio(id);
    setMenuOpen(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Portafolios" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[13px] text-text-secondary">
            Organiza tableros y programas bajo portafolios estratégicos.
          </p>
          <Guard action="create:board">
            <Button icon={Plus} onClick={() => setShowCreate(true)}>Nuevo portafolio</Button>
          </Guard>
        </div>

        {/* Empty state */}
        {!loading && portfolios.length === 0 && (
          <div className="bg-white rounded-xl p-16 shadow-[--shadow-sm] border border-border-light text-center animate-fade-in">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-[18px] font-bold text-text-primary mb-2">Sin portafolios todavía</h3>
            <p className="text-[13px] text-text-secondary max-w-sm mx-auto mb-6">
              Crea un portafolio para agrupar tableros y programas relacionados bajo una visión común.
            </p>
            <Guard action="create:board">
              <Button icon={Plus} onClick={() => setShowCreate(true)}>Crear portafolio</Button>
            </Guard>
          </div>
        )}

        {/* Grid */}
        {portfolios.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map((p) => {
              const programCount = (p.programs ?? []).length;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl p-5 shadow-[--shadow-sm] border border-border-light hover:shadow-[--shadow-md] transition-all group relative cursor-pointer"
                  onClick={() => navigate(`/portfolio/${p.id}`)}
                >
                  {/* Color bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: p.color }} />

                  <div className="flex items-start justify-between mt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${p.color}20` }}>
                        <Briefcase className="w-5 h-5" style={{ color: p.color }} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-semibold text-text-primary group-hover:text-primary transition-colors leading-tight">
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-text-disabled mt-0.5">
                          {programCount} {programCount === 1 ? 'programa' : 'programas'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }}
                      className="p-1 hover:bg-surface-hover rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>

                  {p.description && (
                    <p className="text-[12px] text-text-secondary mt-3 line-clamp-2">{p.description}</p>
                  )}

                  {/* Programs preview */}
                  {programCount > 0 && (
                    <div className="mt-4 space-y-1">
                      {(p.programs ?? []).slice(0, 3).map((prog) => (
                        <div key={prog.id} className="flex items-center gap-2 text-[12px] text-text-secondary">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: prog.color }} />
                          <span className="truncate">{prog.name}</span>
                        </div>
                      ))}
                      {programCount > 3 && (
                        <p className="text-[11px] text-text-disabled pl-4">+{programCount - 3} más</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-4 text-primary text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Ver detalle</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>

                  {/* Context menu */}
                  {menuOpen === p.id && (
                    <PortfolioMenu
                      onEdit={() => { setEditing(p); setMenuOpen(null); }}
                      onDelete={() => handleDelete(p.id)}
                      onClose={() => setMenuOpen(null)}
                    />
                  )}
                </div>
              );
            })}

            {/* Add card */}
            <div
              onClick={() => setShowCreate(true)}
              className="bg-white rounded-xl p-5 shadow-[--shadow-sm] border border-dashed border-border hover:border-primary hover:shadow-[--shadow-md] cursor-pointer transition-all flex items-center justify-center min-h-35"
            >
              <div className="text-center">
                <Plus className="w-8 h-8 text-text-disabled mx-auto mb-1" />
                <span className="text-[13px] text-text-secondary">Nuevo portafolio</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <PortfolioModal onSave={handleCreate} onClose={() => setShowCreate(false)} />
      )}
      {editing && (
        <PortfolioModal initial={editing} onSave={handleUpdate} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function PortfolioMenu({ onEdit, onDelete, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <div className="absolute right-3 top-10 w-36 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-full px-3 py-2 text-left text-[13px] text-text-primary hover:bg-surface-secondary flex items-center gap-2"
        >
          <Edit3 className="w-3.5 h-3.5" /> Editar
        </button>
        <hr className="my-1 border-border-light" />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-full px-3 py-2 text-left text-[13px] text-status-red hover:bg-status-red-light flex items-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      </div>
    </>
  );
}
