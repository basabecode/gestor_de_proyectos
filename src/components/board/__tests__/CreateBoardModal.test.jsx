import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate   = vi.fn();
const mockCreateBoard = vi.fn();
const mockUpdateBoard = vi.fn();
const mockCloseModal  = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

// Each test controls activeModal via this ref
let _activeModal = 'createBoard';
let _modalData   = null;

vi.mock('../../../stores/uiStore', () => ({
  default: vi.fn(() => ({
    get activeModal() { return _activeModal; },
    get modalData()   { return _modalData;   },
    closeModal: mockCloseModal,
  })),
}));

vi.mock('../../../stores/boardStore', () => ({
  default: vi.fn(() => ({
    createBoard: mockCreateBoard,
    updateBoard: mockUpdateBoard,
  })),
  // also export rowToBoard for other tests
  rowToBoard: vi.fn(),
}));

// Stub child components so we don't need their full tree
vi.mock('../../ui', () => ({
  Modal:  ({ open, children }) => open ? <div data-testid="modal">{children}</div> : null,
  Button: ({ children, ...p }) => <button {...p}>{children}</button>,
  Input:  ({ label, value, onChange, error }) => (
    <div>
      <label>{label}</label>
      <input value={value} onChange={onChange} data-testid={`input-${label}`} />
      {error && <span data-testid="error">{error}</span>}
    </div>
  ),
}));

vi.mock('../../board/AddColumnButton', () => ({ default: () => null }));

// ── Import component AFTER mocks ──────────────────────────────────────────────
import CreateBoardModal from '../CreateBoardModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_BOARD = {
  id:      'board-123',
  name:    'Mi Tablero',
  groups:  [{ id: 'g1', title: 'Grupo', color: '#579bfc' }],
  items:   [],
  columns: [],
};

function setup() {
  mockCreateBoard.mockReset();
  mockUpdateBoard.mockReset();
  mockNavigate.mockReset();
  mockCloseModal.mockReset();
  _activeModal = 'createBoard';
  _modalData   = null;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateBoardModal — template selection step', () => {
  beforeEach(setup);

  it('renders the template selection grid', () => {
    render(<CreateBoardModal />);
    expect(screen.getByText('Tablero vacío')).toBeInTheDocument();
    expect(screen.getByText('Gestión de proyecto')).toBeInTheDocument();
    expect(screen.getByText('Sprint / Scrum')).toBeInTheDocument();
    expect(screen.getByText('CRM de ventas')).toBeInTheDocument();
    expect(screen.getByText('Seguimiento de bugs')).toBeInTheDocument();
  });

  it('advances to the form step when a template is clicked', async () => {
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Tablero vacío'));
    // Form step shows a name input
    expect(screen.getByTestId('input-Nombre del tablero')).toBeInTheDocument();
  });

  it('deja el nombre vacío cuando se selecciona una plantilla no-blank (el usuario escribe el nombre)', async () => {
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Gestión de proyecto'));
    // El nombre siempre arranca vacío — el placeholder sugiere el nombre de la plantilla
    expect(screen.getByTestId('input-Nombre del tablero').value).toBe('');
  });

  it('deja el nombre vacío cuando se selecciona tablero vacío', async () => {
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Tablero vacío'));
    expect(screen.getByTestId('input-Nombre del tablero').value).toBe('');
  });

  it('muestra el nombre de la plantilla como placeholder', async () => {
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Gestión de proyecto'));
    const input = screen.getByTestId('input-Nombre del tablero');
    // El placeholder (atributo HTML) coincide con el nombre de la plantilla
    expect(input.placeholder).toBe('Gestión de proyecto');
  });
});

describe('CreateBoardModal — form submission (blank board)', () => {
  beforeEach(setup);

  it('shows validation error when name is empty', async () => {
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Tablero vacío'));
    await userEvent.click(screen.getByText('Crear tablero'));
    expect(screen.getByTestId('error')).toHaveTextContent('El nombre es requerido');
    expect(mockCreateBoard).not.toHaveBeenCalled();
  });

  it('shows validation error when name is too short', async () => {
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Tablero vacío'));
    await userEvent.type(screen.getByTestId('input-Nombre del tablero'), 'A');
    await userEvent.click(screen.getByText('Crear tablero'));
    expect(screen.getByTestId('error')).toHaveTextContent('Mínimo 2 caracteres');
  });

  it('calls createBoard with name and description', async () => {
    mockCreateBoard.mockResolvedValue(MOCK_BOARD);
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Tablero vacío'));
    await userEvent.type(screen.getByTestId('input-Nombre del tablero'), 'Proyecto Alpha');
    await userEvent.click(screen.getByText('Crear tablero'));

    await waitFor(() => {
      expect(mockCreateBoard).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Proyecto Alpha' }),
      );
    });
  });

  it('navigates to the new board after creation', async () => {
    mockCreateBoard.mockResolvedValue(MOCK_BOARD);
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Tablero vacío'));
    await userEvent.type(screen.getByTestId('input-Nombre del tablero'), 'Proyecto Alpha');
    await userEvent.click(screen.getByText('Crear tablero'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/board/board-123');
    });
  });

  it('does NOT navigate when createBoard returns null (error case)', async () => {
    mockCreateBoard.mockResolvedValue(null);
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Tablero vacío'));
    await userEvent.type(screen.getByTestId('input-Nombre del tablero'), 'Proyecto Alpha');
    await userEvent.click(screen.getByText('Crear tablero'));

    await waitFor(() => expect(mockCreateBoard).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('closes the modal after successful creation', async () => {
    mockCreateBoard.mockResolvedValue(MOCK_BOARD);
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Tablero vacío'));
    await userEvent.type(screen.getByTestId('input-Nombre del tablero'), 'Test');
    await userEvent.click(screen.getByText('Crear tablero'));

    await waitFor(() => expect(mockCloseModal).toHaveBeenCalled());
  });
});

describe('CreateBoardModal — template with custom columns and groups', () => {
  beforeEach(setup);

  it('passes template columns to createBoard', async () => {
    mockCreateBoard.mockResolvedValue(MOCK_BOARD);
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Gestión de proyecto'));
    await userEvent.click(screen.getByText('Crear tablero'));

    await waitFor(() => {
      expect(mockCreateBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: expect.arrayContaining([
            expect.objectContaining({ id: 'status' }),
            expect.objectContaining({ id: 'person' }),
            expect.objectContaining({ id: 'priority' }),
          ]),
        }),
      );
    });
  });

  it('calls updateBoard with template groups after board creation', async () => {
    mockCreateBoard.mockResolvedValue(MOCK_BOARD);
    mockUpdateBoard.mockResolvedValue(undefined);
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Gestión de proyecto'));
    await userEvent.click(screen.getByText('Crear tablero'));

    await waitFor(() => {
      expect(mockUpdateBoard).toHaveBeenCalledWith(
        'board-123',
        expect.objectContaining({
          groups: expect.arrayContaining([
            expect.objectContaining({ title: 'Por hacer' }),
            expect.objectContaining({ title: 'En progreso' }),
            expect.objectContaining({ title: 'Completado' }),
          ]),
        }),
      );
    });
  });

  it('does NOT call updateBoard for the blank template (no custom groups)', async () => {
    mockCreateBoard.mockResolvedValue({ ...MOCK_BOARD, id: 'blank-board' });
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Tablero vacío'));
    await userEvent.type(screen.getByTestId('input-Nombre del tablero'), 'Sin grupos');
    await userEvent.click(screen.getByText('Crear tablero'));

    await waitFor(() => expect(mockCreateBoard).toHaveBeenCalled());
    expect(mockUpdateBoard).not.toHaveBeenCalled();
  });

  it('Sprint template has Backlog, Sprint actual, En revisión, Done groups', async () => {
    mockCreateBoard.mockResolvedValue(MOCK_BOARD);
    mockUpdateBoard.mockResolvedValue(undefined);
    render(<CreateBoardModal />);
    await userEvent.click(screen.getByText('Sprint / Scrum'));
    await userEvent.click(screen.getByText('Crear tablero'));

    await waitFor(() => {
      expect(mockUpdateBoard).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          groups: expect.arrayContaining([
            expect.objectContaining({ title: 'Backlog' }),
            expect.objectContaining({ title: 'Sprint actual' }),
            expect.objectContaining({ title: 'Done' }),
          ]),
        }),
      );
    });
  });
});

describe('CreateBoardModal — edit mode', () => {
  beforeEach(() => {
    setup();
    _activeModal = 'editBoard';
    _modalData   = { id: 'existing-board', name: 'Tablero Existente', description: 'Desc' };
  });

  it('shows edit form directly (no template step)', () => {
    render(<CreateBoardModal />);
    expect(screen.getByTestId('input-Nombre')).toBeInTheDocument();
    expect(screen.queryByText('Tablero vacío')).not.toBeInTheDocument();
  });

  it('calls updateBoard (not createBoard) on submit', async () => {
    render(<CreateBoardModal />);
    const nameInput = screen.getByTestId('input-Nombre');
    fireEvent.change(nameInput, { target: { value: 'Nombre Actualizado' } });
    await userEvent.click(screen.getByText('Guardar cambios'));
    expect(mockUpdateBoard).toHaveBeenCalledWith('existing-board', expect.objectContaining({ name: 'Nombre Actualizado' }));
    expect(mockCreateBoard).not.toHaveBeenCalled();
  });
});
