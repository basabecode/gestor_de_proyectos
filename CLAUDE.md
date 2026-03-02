# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (--legacy-peer-deps required due to react-quill/React 19 conflict)
npm install --legacy-peer-deps

# Development server (auto-opens at http://localhost:3000)
npm run dev

# Production build (output to /dist)
npm run build

# Preview production build
npm run preview

# Lint (ESLint 9 flat config)
npm run lint
```

There are no tests in this project.

## Architecture

**Work OS** is a Monday.com-inspired project management SPA built with React 19 + Vite 7 + Tailwind CSS v4. All data persists to localStorage via Zustand's persist middleware — there is no backend.

### Routing & Entry

- `src/main.jsx` — React root with BrowserRouter, QueryClient, and react-hot-toast config
- `src/App.jsx` — Route definitions using React.lazy per page; wraps all routes in `AppLayout` (Sidebar + TopBar)
- Routes: `/` (Home), `/boards` (list), `/board/:boardId`, `/dashboard`, `/inbox`, `/settings`

### State Management (Zustand stores in `src/stores/`)

All stores use `persist` middleware. localStorage keys:

| Store                  | Key                    | Owns                                                             |
| ---------------------- | ---------------------- | ---------------------------------------------------------------- |
| `boardStore.js`        | `workos-boards`        | Boards, groups, items, columns, comments, attachments, sub-items |
| `uiStore.js`           | `workos-ui`            | Sidebar collapsed state, theme, modal visibility, search palette |
| `automationStore.js`   | `workos-automations`   | Automation rules and execution logs                              |
| `dashboardStore.js`    | `workos-dashboard`     | Widget configurations and layout                                 |
| `notificationStore.js` | `workos-notifications` | Notifications and unread count                                   |
| `userStore.js`         | `workos-user`          | Current user profile and team members                            |
| `workspaceStore.js`    | `workos-workspaces`    | Workspace management                                             |

`boardStore` is by far the largest and most central store.

### Component Structure

```
src/components/
  board/        # BoardView, GroupSection, BoardRow, KanbanView, CalendarView,
                # TimelineView, GanttView, ItemDetailPanel, cell types (StatusCell, etc.)
  layout/       # AppLayout, Sidebar, TopBar
  ui/           # Reusable primitives: Button, Avatar, Badge, Modal, Dropdown, etc.
  common/       # SearchPalette (Ctrl+K global search)
  modals/       # CreateBoardModal and other modal dialogs
  automation/   # AutomationsPanel
  dashboard/    # Dashboard widgets
```

### Key Patterns

- **Path alias**: `@/` maps to `src/` (configured in `vite.config.js`). Always use `@/` imports.
- **Code splitting**: Pages are lazy-loaded via `React.lazy`; `vite.config.js` defines manual vendor chunks (react, zustand, recharts, dnd-kit, etc.).
- **Styling**: Tailwind CSS v4 utility classes only. Theme variables (brand blue `#0073ea`, status colors, etc.) are defined in `src/styles/index.css`.
- **Utilities**: `src/lib/utils.js` exports `cn()` (clsx + tailwind-merge), `generateId()` (nanoid), `formatDate()`. `src/lib/constants.js` has status/priority color maps and column type definitions.
- **Drag & drop**: Uses `@dnd-kit` throughout (boards list, kanban columns, dashboard widgets).
- **Icons**: Lucide React exclusively.
- **UI language**: Spanish throughout (labels, comments, documentation).

### Data Import/Export

`src/utils/csvHandler.js` handles CSV (PapaParse) and Excel (XLSX) import/export. `src/utils/storage.js` abstracts localStorage with a fallback to `window.storage` for environments where localStorage is unavailable.

## Al finalizar cada tarea

1. Ejecuta el build del proyecto (`npm run build` o el comando correspondiente).
2. Verifica que el build compile sin errores.
3. Crea tests unitarios para cada funcionalidad nueva o modificada.
4. Ejecuta todos los tests (`npm test`) y verifica que pasen.
5. Si algún test falla, corrígelo antes de dar la tarea como terminada.

## Estándares de testing

- Usa [jest/vitest/pytest] (ajusta según tu stack).
- Cada función pública debe tener al menos un test.
- Incluye casos edge y validaciones de error.
- Los tests deben ser descriptivos en sus nombres.
