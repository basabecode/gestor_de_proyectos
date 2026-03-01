import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase before importing the store ──────────────────────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

vi.mock('@/lib/constants', () => ({
  COLUMN_DEFAULTS: [
    { id: 'status',   title: 'Estado',   type: 'status',   width: 140 },
    { id: 'person',   title: 'Persona',  type: 'person',   width: 130 },
    { id: 'date',     title: 'Fecha',    type: 'date',     width: 130 },
    { id: 'priority', title: 'Prioridad',type: 'priority', width: 130 },
  ],
  GROUP_COLORS: ['#579bfc', '#00c875'],
}));

import { rowToBoard } from '../boardStore';

// ─── rowToBoard defensive tests ──────────────────────────────────────────────

describe('rowToBoard', () => {
  const minimalRow = {
    id:              'board-1',
    name:            'Mi Tablero',
    description:     null,
    workspace_id:    'ws-1',
    columns:         null,   // ← comes null from Supabase in some scenarios
    views:           null,
    active_view_id:  null,
    budget:          null,
    actual_cost:     null,
    planned_start:   null,
    planned_end:     null,
    created_at:      '2025-01-01T00:00:00Z',
    updated_at:      '2025-01-01T00:00:00Z',
  };

  it('always returns items as an array even when DB returns no items', () => {
    const board = rowToBoard(minimalRow, [], []);
    expect(Array.isArray(board.items)).toBe(true);
    expect(board.items).toHaveLength(0);
  });

  it('always returns groups as an array even when DB returns no groups', () => {
    const board = rowToBoard(minimalRow, [], []);
    expect(Array.isArray(board.groups)).toBe(true);
    expect(board.groups).toHaveLength(0);
  });

  it('always returns columns as an array (falls back to COLUMN_DEFAULTS)', () => {
    const board = rowToBoard(minimalRow, [], []);
    expect(Array.isArray(board.columns)).toBe(true);
    expect(board.columns.length).toBeGreaterThan(0);
  });

  it('does NOT crash when called without groups or items arguments', () => {
    expect(() => rowToBoard(minimalRow)).not.toThrow();
  });

  it('maps group rows only for the matching board_id', () => {
    const groupRows = [
      { board_id: 'board-1', id: 'g1', title: 'Grupo A', color: '#fff', position: 0, collapsed: false },
      { board_id: 'board-2', id: 'g2', title: 'Grupo B', color: '#000', position: 0, collapsed: false },
    ];
    const board = rowToBoard(minimalRow, groupRows, []);
    expect(board.groups).toHaveLength(1);
    expect(board.groups[0].id).toBe('g1');
  });

  it('maps item rows only for the matching board_id', () => {
    const itemRows = [
      { board_id: 'board-1', id: 'i1', group_id: 'g1', name: 'Tarea 1', values: {}, position: 0, created_at: '', updated_at: '' },
      { board_id: 'board-9', id: 'i2', group_id: 'g9', name: 'Tarea X', values: {}, position: 0, created_at: '', updated_at: '' },
    ];
    const board = rowToBoard(minimalRow, [], itemRows);
    expect(board.items).toHaveLength(1);
    expect(board.items[0].id).toBe('i1');
  });

  it('maps item.name → item.title', () => {
    const itemRows = [
      { board_id: 'board-1', id: 'i1', group_id: 'g1', name: 'Mi Tarea', values: {}, position: 0, created_at: '', updated_at: '' },
    ];
    const board = rowToBoard(minimalRow, [], itemRows);
    expect(board.items[0].title).toBe('Mi Tarea');
  });

  it('maps item.values → item.columnValues', () => {
    const itemRows = [
      { board_id: 'board-1', id: 'i1', group_id: 'g1', name: 'T', values: { status: 'done' }, position: 0, created_at: '', updated_at: '' },
    ];
    const board = rowToBoard(minimalRow, [], itemRows);
    expect(board.items[0].columnValues).toEqual({ status: 'done' });
  });

  it('defaults budget and actualCost to 0 when null in DB', () => {
    const board = rowToBoard(minimalRow, [], []);
    expect(board.budget).toBe(0);
    expect(board.actualCost).toBe(0);
  });

  it('sorts groups by position ascending', () => {
    const groupRows = [
      { board_id: 'board-1', id: 'g2', title: 'Segundo', color: '#fff', position: 1, collapsed: false },
      { board_id: 'board-1', id: 'g1', title: 'Primero', color: '#fff', position: 0, collapsed: false },
    ];
    const board = rowToBoard(minimalRow, groupRows, []);
    expect(board.groups[0].id).toBe('g1');
    expect(board.groups[1].id).toBe('g2');
  });
});
