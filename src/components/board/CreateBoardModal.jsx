import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Target, Users, ShoppingCart, Bug,
  Rocket, CalendarCheck, Upload, FileSpreadsheet, ChevronLeft,
} from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import useBoardStore from '../../stores/boardStore';
import useUIStore from '../../stores/uiStore';
import useWorkspaceStore from '../../stores/workspaceStore';
import { COLUMN_TYPES } from '../../lib/constants';
import toast from 'react-hot-toast';

const TEMPLATES = [
  {
    id: 'blank',
    name: 'Tablero vacío',
    description: 'Comienza desde cero',
    icon: LayoutGrid,
    color: '#579bfc',
    columns: null, // uses defaults
    groups: null,
  },
  {
    id: 'project',
    name: 'Gestión de proyecto',
    description: 'Tareas, responsables, fechas y prioridades',
    icon: Target,
    color: '#00c875',
    columns: [
      { id: 'status',     title: 'Estado',          type: COLUMN_TYPES.STATUS,     width: 140 },
      { id: 'person',     title: 'Responsable',      type: COLUMN_TYPES.PERSON,     width: 130 },
      { id: 'date_range', title: 'Fechas',           type: COLUMN_TYPES.DATE_RANGE, width: 200 },
      { id: 'priority',   title: 'Prioridad',        type: COLUMN_TYPES.PRIORITY,   width: 130 },
      { id: 'progress',   title: 'Progreso',         type: COLUMN_TYPES.RATING,     width: 120 },
    ],
    groups: [
      { title: 'Por hacer',   color: '#579bfc' },
      { title: 'En progreso', color: '#fdab3d' },
      { title: 'Completado',  color: '#00c875' },
    ],
  },
  {
    id: 'sprint',
    name: 'Sprint / Scrum',
    description: 'Planificación de sprints con puntos de historia',
    icon: Rocket,
    color: '#a25ddc',
    columns: [
      { id: 'status',     title: 'Estado',    type: COLUMN_TYPES.STATUS,     width: 140 },
      { id: 'person',     title: 'Asignado',  type: COLUMN_TYPES.PERSON,     width: 130 },
      { id: 'date_range', title: 'Fechas',    type: COLUMN_TYPES.DATE_RANGE, width: 200 },
      { id: 'priority',   title: 'Prioridad', type: COLUMN_TYPES.PRIORITY,   width: 130 },
      { id: 'points',     title: 'Puntos',    type: COLUMN_TYPES.NUMBER,     width: 100 },
      { id: 'sprint_tag', title: 'Sprint',    type: COLUMN_TYPES.TAG,        width: 130 },
    ],
    groups: [
      { title: 'Backlog', color: '#c4c4c4' },
      { title: 'Sprint actual', color: '#579bfc' },
      { title: 'En revisión', color: '#a25ddc' },
      { title: 'Done', color: '#00c875' },
    ],
  },
  {
    id: 'crm',
    name: 'CRM de ventas',
    description: 'Pipeline de ventas y seguimiento de clientes',
    icon: ShoppingCart,
    color: '#ff642e',
    columns: [
      { id: 'status', title: 'Etapa', type: COLUMN_TYPES.STATUS, width: 140 },
      { id: 'person', title: 'Vendedor', type: COLUMN_TYPES.PERSON, width: 130 },
      { id: 'company', title: 'Empresa', type: COLUMN_TYPES.TEXT, width: 150 },
      { id: 'deal_value', title: 'Valor', type: COLUMN_TYPES.NUMBER, width: 110 },
      { id: 'date', title: 'Cierre esperado', type: COLUMN_TYPES.DATE, width: 130 },
      { id: 'priority', title: 'Prioridad', type: COLUMN_TYPES.PRIORITY, width: 130 },
    ],
    groups: [
      { title: 'Prospectos', color: '#579bfc' },
      { title: 'En negociación', color: '#fdab3d' },
      { title: 'Propuesta enviada', color: '#a25ddc' },
      { title: 'Cerrado ganado', color: '#00c875' },
    ],
  },
  {
    id: 'bugs',
    name: 'Seguimiento de bugs',
    description: 'Registro y seguimiento de errores',
    icon: Bug,
    color: '#e2445c',
    columns: [
      { id: 'status', title: 'Estado', type: COLUMN_TYPES.STATUS, width: 140 },
      { id: 'person', title: 'Asignado', type: COLUMN_TYPES.PERSON, width: 130 },
      { id: 'priority', title: 'Severidad', type: COLUMN_TYPES.PRIORITY, width: 130 },
      { id: 'environment', title: 'Entorno', type: COLUMN_TYPES.TAG, width: 130 },
      { id: 'date', title: 'Reportado', type: COLUMN_TYPES.DATE, width: 130 },
    ],
    groups: [
      { title: 'Nuevos', color: '#e2445c' },
      { title: 'En investigación', color: '#fdab3d' },
      { title: 'Resueltos', color: '#00c875' },
    ],
  },
  {
    id: 'content',
    name: 'Calendario editorial',
    description: 'Planificación de contenido y publicaciones',
    icon: CalendarCheck,
    color: '#66ccff',
    columns: [
      { id: 'status', title: 'Estado', type: COLUMN_TYPES.STATUS, width: 140 },
      { id: 'person', title: 'Autor', type: COLUMN_TYPES.PERSON, width: 130 },
      { id: 'date', title: 'Publicación', type: COLUMN_TYPES.DATE, width: 130 },
      { id: 'channel', title: 'Canal', type: COLUMN_TYPES.TAG, width: 130 },
      { id: 'link', title: 'URL', type: COLUMN_TYPES.LINK, width: 140 },
    ],
    groups: [
      { title: 'Ideas', color: '#c4c4c4' },
      { title: 'En redacción', color: '#fdab3d' },
      { title: 'Publicado', color: '#00c875' },
    ],
  },
  {
    id: 'team',
    name: 'Gestión de equipo',
    description: 'Seguimiento de tareas del equipo y capacidad',
    icon: Users,
    color: '#037f4c',
    columns: [
      { id: 'status', title: 'Estado', type: COLUMN_TYPES.STATUS, width: 140 },
      { id: 'person', title: 'Miembro', type: COLUMN_TYPES.PERSON, width: 130 },
      { id: 'date', title: 'Fecha', type: COLUMN_TYPES.DATE, width: 130 },
      { id: 'priority', title: 'Prioridad', type: COLUMN_TYPES.PRIORITY, width: 130 },
      { id: 'done_check', title: 'Completado', type: COLUMN_TYPES.CHECKBOX, width: 110 },
    ],
    groups: [
      { title: 'Esta semana', color: '#579bfc' },
      { title: 'Próxima semana', color: '#a25ddc' },
      { title: 'Backlog', color: '#c4c4c4' },
    ],
  },
];

export default function CreateBoardModal() {
  const navigate = useNavigate();
  const { activeModal, modalData, closeModal } = useUIStore();
  const { createBoard, updateBoard, addGroup, deleteGroup } = useBoardStore();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const isEdit = activeModal === 'editBoard';
  const isOpen = activeModal === 'createBoard' || isEdit;

  const [step, setStep] = useState('template'); // template | form | import
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [namePlaceholder, setNamePlaceholder] = useState('Ej: Proyecto Marketing Q1');
  const [descPlaceholder, setDescPlaceholder] = useState('Describe el propósito del tablero...');
  const [error, setError] = useState('');

  // Patrón React recomendado: sincronizar estado con props sin useEffect
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevIsEditOpen, setPrevIsEditOpen] = useState(false);
  const currentIsEditOpen = isEdit && isOpen;
  if (currentIsEditOpen !== prevIsEditOpen) {
    setPrevIsEditOpen(currentIsEditOpen);
    if (currentIsEditOpen && modalData) {
      setName(modalData.name || '');
      setDescription(modalData.description || '');
    }
  }

  const resetAndClose = () => {
    closeModal();
    setStep('template');
    setSelectedTemplate(null);
    setName('');
    setDescription('');
    setNamePlaceholder('Ej: Proyecto Marketing Q1');
    setDescPlaceholder('Describe el propósito del tablero...');
    setError('');
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    // Los campos arrancan VACÍOS — el nombre de la plantilla es solo un placeholder sugerido
    setName('');
    setDescription('');
    setNamePlaceholder(template.id === 'blank' ? 'Ej: Mi nuevo tablero' : template.name);
    setDescPlaceholder(template.description || 'Describe el propósito del tablero...');
    setStep('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    if (name.trim().length < 2) { setError('Mínimo 2 caracteres'); return; }

    if (isEdit && modalData) {
      updateBoard(modalData.id, { name: name.trim(), description: description.trim() });
      resetAndClose();
    } else {
      const data = { name: name.trim(), description: description.trim(), workspaceId: activeWorkspaceId };
      if (selectedTemplate?.columns) data.columns = selectedTemplate.columns;
      if (selectedTemplate?.groups) data.customGroups = selectedTemplate.groups;
      const board = await createBoardWithTemplate(data);
      if (board?.id) {
        resetAndClose();
        navigate(`/board/${board.id}`);
      }
    }
  };

  const createBoardWithTemplate = async (data) => {
    const board = await createBoard({
      name: data.name,
      description: data.description,
      columns: data.columns,
      workspaceId: data.workspaceId,
    });
    if (!board) return null;

    // Si la plantilla tiene grupos: eliminar el grupo inicial y crear los de la plantilla en Supabase
    if (data.customGroups?.length) {
      // Eliminar el grupo vacío por defecto creado por createBoard
      if (board.groups?.[0]?.id) {
        await deleteGroup(board.id, board.groups[0].id);
      }
      // Crear cada grupo de la plantilla (persiste en Supabase)
      for (const g of data.customGroups) {
        await addGroup(board.id, { title: g.title, color: g.color });
      }
    }
    return board;
  };

  const handleCSVImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target.result;
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) { toast.error('El CSV debe tener al menos una fila de datos'); return; }

        const headers = parseCSVLine(lines[0]);
        const rows = lines.slice(1).map(parseCSVLine);

        const boardName = file.name.replace(/\.csv$/i, '');
        const board = await createBoard({ name: boardName });
        if (!board?.id) { toast.error('Error al crear el tablero'); return; }

        const group = (board.groups ?? [])[0];
        const store = useBoardStore.getState();

        rows.forEach((row) => {
          const title = row[0] || 'Sin título';
          const columnValues = {};
          headers.forEach((h, idx) => {
            if (idx === 0) return; // title
            const key = h.toLowerCase().trim();
            if (key === 'estado' || key === 'status') columnValues.status = mapStatus(row[idx]);
            else if (key === 'persona' || key === 'person') columnValues.person = row[idx]?.trim();
            else if (key === 'fecha' || key === 'date') columnValues.date = row[idx]?.trim();
            else if (key === 'prioridad' || key === 'priority') columnValues.priority = mapPriority(row[idx]);
          });
          store.addItem(board.id, group.id, { title: title.trim(), columnValues });
        });

        toast.success(`Importado: ${rows.length} elementos desde CSV`);
        resetAndClose();
        navigate(`/board/${board.id}`);
      } catch {
        toast.error('Error al procesar el CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Render edit mode
  if (isEdit) {
    return (
      <Modal open={isOpen} onClose={resetAndClose} title="Editar tablero" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Nombre del tablero"
            error={error}
            autoFocus
          />
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe brevemente el tablero..."
              className="w-full px-3 py-2 text-[14px] rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none placeholder:text-text-disabled"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={resetAndClose}>Cancelar</Button>
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal open={isOpen} onClose={resetAndClose} title={step === 'template' ? 'Crear nuevo tablero' : 'Configurar tablero'} size={step === 'template' ? 'xl' : 'md'}>
      {/* Step: Template selection */}
      {step === 'template' && (
        <div>
          <p className="text-[13px] text-text-secondary mb-4">Selecciona una plantilla o importa datos existentes</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="text-left p-4 rounded-lg border border-border-light hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: tpl.color + '20' }}>
                    <Icon className="w-5 h-5" style={{ color: tpl.color }} />
                  </div>
                  <p className="text-[13px] font-semibold text-text-primary group-hover:text-primary transition-colors">{tpl.name}</p>
                  <p className="text-[11px] text-text-disabled mt-0.5 line-clamp-2">{tpl.description}</p>
                </button>
              );
            })}
          </div>

          {/* Import section */}
          <div className="border-t border-border-light pt-4">
            <p className="text-[11px] font-semibold text-text-disabled uppercase mb-2">Importar datos</p>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-text-secondary" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-text-primary">Importar desde CSV</p>
                <p className="text-[11px] text-text-disabled">Primera columna = título, columnas opcionales: estado, persona, fecha, prioridad</p>
              </div>
              <Upload className="w-4 h-4 text-text-disabled ml-auto" />
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
            </label>
          </div>
        </div>
      )}

      {/* Step: Form */}
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <button type="button" onClick={() => setStep('template')} className="flex items-center gap-1 text-[12px] text-text-secondary hover:text-primary mb-2">
            <ChevronLeft className="w-3.5 h-3.5" /> Volver a plantillas
          </button>

          {selectedTemplate && (
            <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg mb-2">
              {(() => { const Icon = selectedTemplate.icon; return <Icon className="w-5 h-5" style={{ color: selectedTemplate.color }} />; })()}
              <div>
                <p className="text-[12px] font-semibold text-text-primary">Plantilla: {selectedTemplate.name}</p>
                <p className="text-[10px] text-text-disabled">
                  {selectedTemplate.columns ? `${selectedTemplate.columns.length} columnas` : 'Columnas predeterminadas'}
                  {selectedTemplate.groups ? ` · ${selectedTemplate.groups.length} grupos` : ''}
                </p>
              </div>
            </div>
          )}

          <Input
            label="Nombre del tablero"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder={namePlaceholder}
            error={error}
            autoFocus
          />
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={descPlaceholder}
              rows={2}
              className="w-full px-3 py-2 text-[14px] rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none placeholder:text-text-disabled"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={resetAndClose}>Cancelar</Button>
            <Button type="submit">Crear tablero</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// CSV helpers
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function mapStatus(val) {
  if (!val) return 'pending';
  const v = val.toLowerCase().trim();
  if (v.includes('listo') || v.includes('done') || v.includes('completado')) return 'done';
  if (v.includes('trabaj') || v.includes('progre') || v.includes('working')) return 'working_on_it';
  if (v.includes('deten') || v.includes('stuck') || v.includes('bloqu')) return 'stuck';
  if (v.includes('revis')) return 'review';
  return 'pending';
}

function mapPriority(val) {
  if (!val) return 'none';
  const v = val.toLowerCase().trim();
  if (v.includes('crít') || v.includes('critical')) return 'critical';
  if (v.includes('alta') || v.includes('high')) return 'high';
  if (v.includes('media') || v.includes('medium')) return 'medium';
  if (v.includes('baja') || v.includes('low')) return 'low';
  return 'none';
}
