import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Briefcase, FolderGit2, LayoutGrid,
  Edit3, Trash2, MoreVertical, ChevronLeft, X,
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui';
import usePortfolioStore from '../stores/portfolioStore';
import useBoardStore from '../stores/boardStore';
import useWorkspaceStore from '../stores/workspaceStore';
import { Guard } from '../components/auth/Guard';

// ── Program modal ─────────────────────────────────────────────────────────────

function ProgramModal({ portfolioId, initial, onSave, onClose }) {
  const [name, setName]     = useState(initial?.name        || '');
  const [desc, setDesc]     = useState(initial?.description || '');
  const [color, setColor]   = useState(initial?.color       || '#00c875');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

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
          {initial ? 'Editar programa' : 'Nuevo programa'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Nombre *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Ej. Transformación digital"
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

// ── Board-assignment picker ───────────────────────────────────────────────────

function AssignBoardModal({ portfolioId, programId, alreadyAssigned, onAssign, onClose }) {
  const { boards } = useBoardStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const [saving, setSaving] = useState(false);

  const candidates = boards.filter(
    (b) => b.workspaceId === activeWorkspaceId && !alreadyAssigned.includes(b.id),
  );

  const assign = async (boardId) => {
    setSaving(true);
    await onAssign(boardId);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-text-primary">Asignar tablero</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-hover rounded">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {candidates.length === 0 ? (
          <p className="text-[13px] text-text-secondary py-4 text-center">
            No hay tableros disponibles para asignar.
          </p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {candidates.map((b) => (
              <button
                key={b.id}
                disabled={saving}
                onClick={() => assign(b.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-secondary text-left transition-colors"
              >
                <LayoutGrid className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-text-primary">{b.name}</p>
                  {b.description && (
                    <p className="text-[11px] text-text-disabled truncate max-w-55">{b.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Program section ───────────────────────────────────────────────────────────

function ProgramSection({ portfolio, program, onEdit, onDelete }) {
  const navigate = useNavigate();
  const { boards } = useBoardStore();
  const { updateBoard } = useBoardStore();
  const { updateProgram } = usePortfolioStore();

  const [showAssign, setShowAssign] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(null);

  // Boards assigned to this program
  const programBoards = boards.filter((b) => b.programId === program.id);
  // Boards assigned to the portfolio (any program) for exclusion
  const portfolioBoards = boards.filter((b) => b.portfolioId === portfolio.id);

  const handleAssign = async (boardId) => {
    await updateBoard(boardId, { portfolioId: portfolio.id, programId: program.id });
  };

  const handleUnassign = async (boardId) => {
    await updateBoard(boardId, { portfolioId: null, programId: null });
  };

  return (
    <div className="bg-white rounded-xl border border-border-light shadow-[--shadow-sm] overflow-hidden">
      {/* Program header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: program.color }} />
          <h3 className="text-[14px] font-semibold text-text-primary">{program.name}</h3>
          {program.description && (
            <span className="text-[12px] text-text-secondary">{program.description}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Guard action="create:board">
            <button
              onClick={() => setShowAssign(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] text-primary hover:bg-primary/10 rounded-md transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Tablero
            </button>
          </Guard>
          <button
            onClick={() => setMenuOpen(menuOpen ? null : program.id)}
            className="p-1.5 hover:bg-surface-hover rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-text-secondary" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
              <div className="absolute right-4 mt-8 w-36 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20">
                <button
                  onClick={() => { onEdit(program); setMenuOpen(null); }}
                  className="w-full px-3 py-2 text-left text-[13px] text-text-primary hover:bg-surface-secondary flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>
                <hr className="my-1 border-border-light" />
                <button
                  onClick={() => { onDelete(program.id); setMenuOpen(null); }}
                  className="w-full px-3 py-2 text-left text-[13px] text-status-red hover:bg-status-red-light flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Boards list */}
      <div className="divide-y divide-border-light">
        {programBoards.length === 0 ? (
          <p className="px-4 py-4 text-[12px] text-text-disabled text-center">
            Sin tableros asignados —{' '}
            <button className="text-primary hover:underline" onClick={() => setShowAssign(true)}>
              asignar uno
            </button>
          </p>
        ) : (
          programBoards.map((b) => (
            <div key={b.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary/50 group transition-colors">
              <LayoutGrid className="w-4 h-4 text-primary shrink-0" />
              <button
                className="flex-1 text-left text-[13px] font-medium text-text-primary hover:text-primary transition-colors"
                onClick={() => navigate(`/board/${b.id}`)}
              >
                {b.name}
              </button>
              {b.description && (
                <span className="text-[12px] text-text-disabled truncate max-w-50 hidden md:block">{b.description}</span>
              )}
              <button
                onClick={() => handleUnassign(b.id)}
                title="Quitar del programa"
                className="p-1 hover:bg-surface-hover rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5 text-text-secondary" />
              </button>
            </div>
          ))
        )}
      </div>

      {showAssign && (
        <AssignBoardModal
          portfolioId={portfolio.id}
          programId={program.id}
          alreadyAssigned={portfolioBoards.map((b) => b.id)}
          onAssign={handleAssign}
          onClose={() => setShowAssign(false)}
        />
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { portfolios, updatePortfolio, createProgram, updateProgram, deleteProgram } = usePortfolioStore();
  const { boards, updateBoard } = useBoardStore();
  const { activeWorkspaceId } = useWorkspaceStore();

  const portfolio = portfolios.find((p) => p.id === id);

  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram]      = useState(null);
  const [showAssignDirect, setShowAssignDirect]  = useState(false);

  if (!portfolio) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Portafolio" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[14px] text-text-secondary mb-4">Portafolio no encontrado.</p>
            <Button variant="secondary" onClick={() => navigate('/portfolios')}>Volver</Button>
          </div>
        </div>
      </div>
    );
  }

  const programs = portfolio.programs ?? [];

  // Boards assigned directly to portfolio (no program)
  const directBoards = boards.filter(
    (b) => b.portfolioId === portfolio.id && !b.programId,
  );

  const handleCreateProgram = async (data) => {
    await createProgram(portfolio.id, data);
    setShowProgramModal(false);
  };

  const handleUpdateProgram = async (data) => {
    await updateProgram(portfolio.id, editingProgram.id, data);
    setEditingProgram(null);
  };

  const handleDeleteProgram = async (programId) => {
    if (!confirm('¿Eliminar este programa? Los tableros asignados quedarán sin programa.')) return;
    await deleteProgram(portfolio.id, programId);
  };

  const handleAssignDirect = async (boardId) => {
    await updateBoard(boardId, { portfolioId: portfolio.id, programId: null });
  };

  const handleUnassignDirect = async (boardId) => {
    await updateBoard(boardId, { portfolioId: null, programId: null });
  };

  const allAssigned = boards
    .filter((b) => b.portfolioId === portfolio.id)
    .map((b) => b.id);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title={portfolio.name} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/portfolios')}
          className="flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-primary transition-colors mb-4"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Portafolios
        </button>

        {/* Portfolio header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${portfolio.color}20` }}
          >
            <Briefcase className="w-6 h-6" style={{ color: portfolio.color }} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-text-primary">{portfolio.name}</h1>
            {portfolio.description && (
              <p className="text-[13px] text-text-secondary mt-0.5">{portfolio.description}</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Guard action="create:board">
              <Button variant="secondary" icon={Plus} onClick={() => setShowProgramModal(true)}>
                Nuevo programa
              </Button>
            </Guard>
          </div>
        </div>

        {/* Programs */}
        <div className="space-y-4">
          {programs.length === 0 && directBoards.length === 0 && (
            <div className="bg-white rounded-xl p-12 shadow-[--shadow-sm] border border-border-light text-center">
              <FolderGit2 className="w-12 h-12 text-text-disabled mx-auto mb-3" />
              <h3 className="text-[15px] font-semibold text-text-primary mb-1">Sin programas todavía</h3>
              <p className="text-[13px] text-text-secondary max-w-sm mx-auto mb-5">
                Crea programas para agrupar tableros relacionados dentro de este portafolio.
              </p>
              <Guard action="create:board">
                <Button icon={Plus} onClick={() => setShowProgramModal(true)}>Crear programa</Button>
              </Guard>
            </div>
          )}

          {programs.map((prog) => (
            <div key={prog.id} className="relative">
              <ProgramSection
                portfolio={portfolio}
                program={prog}
                onEdit={setEditingProgram}
                onDelete={handleDeleteProgram}
              />
            </div>
          ))}

          {/* Direct boards section (no program) */}
          <div className="bg-white rounded-xl border border-border-light shadow-[--shadow-sm] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
              <h3 className="text-[14px] font-semibold text-text-secondary">Sin programa</h3>
              <Guard action="create:board">
                <button
                  onClick={() => setShowAssignDirect(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] text-primary hover:bg-primary/10 rounded-md transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Tablero
                </button>
              </Guard>
            </div>
            <div className="divide-y divide-border-light">
              {directBoards.length === 0 ? (
                <p className="px-4 py-4 text-[12px] text-text-disabled text-center">
                  Sin tableros asignados directamente.
                </p>
              ) : (
                directBoards.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary/50 group transition-colors">
                    <LayoutGrid className="w-4 h-4 text-primary shrink-0" />
                    <button
                      className="flex-1 text-left text-[13px] font-medium text-text-primary hover:text-primary transition-colors"
                      onClick={() => navigate(`/board/${b.id}`)}
                    >
                      {b.name}
                    </button>
                    {b.description && (
                      <span className="text-[12px] text-text-disabled truncate max-w-50 hidden md:block">{b.description}</span>
                    )}
                    <button
                      onClick={() => handleUnassignDirect(b.id)}
                      title="Quitar del portafolio"
                      className="p-1 hover:bg-surface-hover rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 text-text-secondary" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showProgramModal && (
        <ProgramModal
          portfolioId={portfolio.id}
          onSave={handleCreateProgram}
          onClose={() => setShowProgramModal(false)}
        />
      )}
      {editingProgram && (
        <ProgramModal
          portfolioId={portfolio.id}
          initial={editingProgram}
          onSave={handleUpdateProgram}
          onClose={() => setEditingProgram(null)}
        />
      )}
      {showAssignDirect && (
        <AssignBoardModal
          portfolioId={portfolio.id}
          programId={null}
          alreadyAssigned={allAssigned}
          onAssign={handleAssignDirect}
          onClose={() => setShowAssignDirect(false)}
        />
      )}
    </div>
  );
}
