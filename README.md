# Work OS - Sistema de Gestion de Proyectos

Sistema completo de gestion de proyectos estilo Monday.com, construido con React 19, Vite 7, Tailwind CSS v4 y Zustand.

## Tecnologias

| Tecnologia | Version | Uso |
|---|---|---|
| React | 19.2 | UI Framework |
| Vite | 7.3 | Build tool + HMR |
| Tailwind CSS | 4.1 | Estilos utility-first |
| Zustand | 5.0 | Estado global con persistencia |
| React Router | 7.13 | Navegacion SPA |
| @dnd-kit | 6.3 / 10.0 | Drag & Drop (filas, kanban, widgets) |
| Recharts | 3.7 | Graficos del dashboard |
| Lucide React | 0.564 | Iconografia |
| react-hot-toast | 2.6 | Notificaciones toast |

## Instalacion

```bash
# Clonar e instalar
cd gestor-proyectos
npm install --legacy-peer-deps

# Desarrollo
npm run dev

# Build de produccion
npm run build

# Preview del build
npm run preview
```

> **Nota:** Se requiere `--legacy-peer-deps` por compatibilidad de react-quill con React 19.

## Estructura del Proyecto

```
src/
├── components/
│   ├── board/           # Componentes de tablero
│   │   ├── BoardView.jsx          # Vista principal con tabs (Tabla/Kanban/Calendario/Timeline/Gantt)
│   │   ├── BoardRow.jsx           # Fila de item con celdas dinamicas
│   │   ├── GroupSection.jsx       # Grupos colapsables con items
│   │   ├── KanbanView.jsx         # Vista Kanban con drag & drop
│   │   ├── CalendarView.jsx       # Vista de calendario
│   │   ├── TimelineView.jsx       # Vista timeline horizontal
│   │   ├── GanttView.jsx          # Diagrama de Gantt
│   │   ├── ItemDetailPanel.jsx    # Panel lateral de detalle (comments, files, activity)
│   │   ├── AutomationsPanel.jsx   # Panel de automatizaciones
│   │   ├── CreateBoardModal.jsx   # Modal con plantillas y CSV import
│   │   └── columns/              # Celdas por tipo de columna
│   │       ├── StatusCell.jsx
│   │       ├── PersonCell.jsx
│   │       ├── DateCell.jsx
│   │       ├── PriorityCell.jsx
│   │       ├── TextCell.jsx
│   │       ├── NumberCell.jsx
│   │       ├── CheckboxCell.jsx
│   │       ├── RatingCell.jsx
│   │       ├── LinkCell.jsx
│   │       └── TagCell.jsx
│   ├── layout/
│   │   ├── AppLayout.jsx         # Layout principal (Sidebar + contenido)
│   │   ├── Sidebar.jsx           # Navegacion lateral colapsable
│   │   └── TopBar.jsx            # Barra superior con notificaciones
│   ├── common/
│   │   └── SearchPalette.jsx     # Busqueda global (Ctrl+K)
│   └── ui/
│       └── index.jsx             # Componentes UI reutilizables (Button, Avatar, Badge, Modal)
├── pages/
│   ├── HomePage.jsx              # Dashboard de inicio con stats y acciones rapidas
│   ├── BoardPage.jsx             # Pagina individual de tablero
│   ├── BoardsListPage.jsx        # Lista/grid de todos los tableros
│   ├── DashboardPage.jsx         # Dashboard con widgets arrastrables
│   ├── InboxPage.jsx             # Bandeja de notificaciones
│   └── SettingsPage.jsx          # Configuracion completa (perfil, equipo, preferencias)
├── stores/
│   ├── boardStore.js             # Estado de tableros, items, columnas, comments, attachments
│   ├── workspaceStore.js         # Espacios de trabajo
│   ├── uiStore.js                # Estado UI (sidebar, modales, tema)
│   ├── dashboardStore.js         # Widgets del dashboard
│   ├── automationStore.js        # Motor de automatizaciones
│   ├── notificationStore.js      # Notificaciones del sistema
│   └── userStore.js              # Perfil, equipo y preferencias
├── lib/
│   ├── constants.js              # Status, prioridades, colores, tipos de columna
│   └── utils.js                  # Utilidades (cn, generateId, formatDate, etc.)
├── styles/
│   └── index.css                 # Estilos globales + tema + animaciones
└── App.jsx                       # Rutas y layout principal
```

## Funcionalidades

### Tableros de Trabajo
- Crear tableros desde **7 plantillas** (Proyecto, Sprint, CRM, Bugs, Contenido, Equipo) o en blanco
- **Importar CSV** para crear tableros con datos existentes
- Columnas personalizables: Estado, Persona, Fecha, Prioridad, Texto, Numero, Checkbox, Rating, Link, Tags
- Grupos colapsables con colores personalizados
- Edicion inline de titulos y valores

### 5 Vistas de Tablero
1. **Tabla** - Vista principal estilo spreadsheet con celdas editables
2. **Kanban** - Tarjetas agrupadas por estado con drag & drop
3. **Calendario** - Visualizacion mensual por fechas
4. **Timeline** - Linea temporal horizontal
5. **Gantt** - Diagrama de Gantt con barras de progreso

### Drag & Drop
- Reordenar filas dentro de grupos
- Mover tarjetas entre columnas en Kanban
- Reordenar widgets del dashboard
- Basado en @dnd-kit para rendimiento optimo

### Panel de Detalle de Items
- **Comentarios** con soporte de @menciones
- **Archivos adjuntos** (hasta 5MB)
- **Registro de actividad** automatico
- **Sub-items** con barra de progreso
- Panel deslizable desde la derecha

### Motor de Automatizaciones
- **5 tipos de trigger**: Cambio de estado, Item creado, Fecha alcanzada, Cambio de prioridad, Persona asignada
- **6 tipos de accion**: Cambiar estado, Asignar persona, Cambiar prioridad, Mover a grupo, Notificar, Establecer fecha
- Condiciones configurables
- Log de ejecucion con historial
- Activar/desactivar reglas individualmente

### Dashboard con Widgets
- **9 tipos de widget**: Resumen, Estado (Pie), Tableros (Barras), Actividad reciente, Equipo, Carga de trabajo, Prioridad, Vencidos, Tendencia
- Modo edicion con agregar/eliminar widgets
- Drag & drop para reordenar
- Tamanos configurables (completo, 2/3, mitad, tercio)

### Sistema de Notificaciones
- Notificaciones por: menciones, asignaciones, automatizaciones, comentarios
- Bandeja de entrada con filtros (Todas, No leidas, por tipo)
- Badge de contador en sidebar y topbar
- Marcar leidas individual y masivamente
- Dropdown rapido en la barra superior

### Busqueda Global
- Atajo `Ctrl+K` / `Cmd+K`
- Busca en tableros, items, grupos y columnas
- Resultados categorizados con navegacion directa

### Pagina de Configuracion
- **Perfil**: Nombre, email, cargo, color de avatar
- **Equipo**: Agregar/eliminar miembros, cambiar roles (Propietario, Admin, Miembro, Observador)
- **Preferencias**: Idioma, formato de fecha/hora, modo compacto, vista default
- **Notificaciones**: Email, push, sonidos
- **Espacio de trabajo**: Nombre y configuracion
- **Apariencia**: Seleccion de tema (claro/oscuro/sistema)

### UX/UI
- Diseno inspirado en Monday.com
- Sidebar colapsable con navegacion principal
- Animaciones suaves (fade, slide, scale)
- Empty states descriptivos con CTAs claros
- Scrollbars estilizados
- Responsive con grid adaptable
- Paleta de colores profesional con estados semanticos

## Estado Persistente

Toda la data se guarda en `localStorage` a traves de Zustand persist:

| Key | Contenido |
|---|---|
| `workos-boards` | Tableros, grupos, items, columnas, comments, attachments |
| `workos-workspaces` | Espacios de trabajo |
| `workos-ui` | Sidebar collapsed, tema |
| `workos-dashboard` | Widgets del dashboard |
| `workos-automations` | Reglas de automatizacion |
| `workos-notifications` | Notificaciones del sistema |
| `workos-user` | Perfil, equipo, preferencias |

## Scripts

```bash
npm run dev       # Servidor de desarrollo con HMR
npm run build     # Build de produccion optimizado
npm run preview   # Preview del build local
npm run lint      # ESLint
```

## Arquitectura

- **Code splitting** con `React.lazy` + `Suspense` por pagina
- **Manual chunks** en Vite para vendor splitting (react, dnd-kit, recharts, zustand)
- **Path alias** `@` → `/src`
- **Persistencia** con Zustand middleware + localStorage
- **Componentes UI** reutilizables (Button, Avatar, Badge, Modal)
