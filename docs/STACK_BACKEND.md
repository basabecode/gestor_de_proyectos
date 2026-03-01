# Work OS - Stack Tecnologico Backend & Roadmap de Mejoras

## Tabla de Contenidos

1. [Estado Actual del Proyecto](#1-estado-actual-del-proyecto)
2. [Stack Backend Recomendado](#2-stack-backend-recomendado)
3. [Diseño de Base de Datos](#3-diseño-de-base-de-datos)
4. [Arquitectura de API](#4-arquitectura-de-api)
5. [Autenticacion y Seguridad](#5-autenticacion-y-seguridad)
6. [Infraestructura y Despliegue](#6-infraestructura-y-despliegue)
7. [Tiempo Real y Colaboracion](#7-tiempo-real-y-colaboracion)
8. [Almacenamiento de Archivos](#8-almacenamiento-de-archivos)
9. [Mejoras de Diseño UI/UX](#9-mejoras-de-diseño-uiux)
10. [Mejoras de Frontend](#10-mejoras-de-frontend)
11. [Plan de Migracion](#11-plan-de-migracion)
12. [Roadmap por Fases](#12-roadmap-por-fases)

---

## 1. Estado Actual del Proyecto

### Arquitectura actual: 100% Client-Side

```
┌─────────────────────────────────────────────────┐
│                   NAVEGADOR                      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  React   │  │ Zustand  │  │ localStorage │  │
│  │  19.2    │──│  Stores  │──│  Persistencia│  │
│  │  + Vite  │  │  (7)     │  │  (~5-10MB)   │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                  │
│  React Router │ @dnd-kit │ Recharts │ Tailwind  │
└─────────────────────────────────────────────────┘
```

### Limitaciones actuales

| Limitacion | Impacto | Prioridad |
|---|---|---|
| Sin autenticacion | No hay identidad de usuario real | Critica |
| localStorage unico | Max ~5-10MB, datos solo en un navegador | Critica |
| Sin colaboracion | Un solo usuario puede ver/editar datos | Alta |
| Archivos en base64 | Ineficiente, consume localStorage | Alta |
| Sin validacion server | Datos sin integridad garantizada | Alta |
| Sin backup | Limpiar cache = perder todo | Media |
| Sin busqueda avanzada | Solo busqueda client-side en memoria | Media |
| Sin auditoria real | Activity log solo local | Baja |

### Fortalezas para la migracion

- **7 stores Zustand** con modelos de datos claros y bien definidos
- **TanStack React Query** ya instalado y configurado (staleTime: 5min, retry: 1)
- Patrones async/await ya implementados en la capa de storage
- Code splitting con React.lazy listo para lazy-loading de modulos
- Arquitectura modular que permite reemplazar stores por API calls incrementalmente

---

## 2. Stack Backend Recomendado

### Opcion A: Node.js + PostgreSQL (Recomendada)

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│   React 19 + Vite 7 + Tailwind v4 + Zustand + React Query  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────┴─────────────────────────────────┐
│                     API GATEWAY / PROXY                       │
│                     (Nginx / Vercel Edge)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                       BACKEND                                │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Node.js   │  │   Fastify    │  │   WebSocket       │  │
│  │   (v22 LTS) │  │   Framework  │  │   (Socket.io)     │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬──────────┘  │
│         │                │                     │             │
│  ┌──────┴────────────────┴─────────────────────┴─────────┐  │
│  │                   Servicios                            │  │
│  │  Auth │ Boards │ Items │ Automations │ Notifications   │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │              Prisma ORM (Query Builder)                │  │
│  └───────────────────────┬───────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    BASE DE DATOS                             │
│                                                              │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │  PostgreSQL  │  │    Redis    │  │  S3 / Cloudflare  │  │
│  │  (Principal) │  │  (Cache +   │  │  R2 (Archivos)    │  │
│  │              │  │  Sessions)  │  │                    │  │
│  └──────────────┘  └─────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Justificacion de cada tecnologia

| Componente | Tecnologia | Razon |
|---|---|---|
| **Runtime** | Node.js 22 LTS | Mismo lenguaje que frontend (JS/TS), ecosistema npm compartido |
| **Framework** | Fastify | 2-3x mas rapido que Express, schema validation nativa, plugin ecosystem |
| **ORM** | Prisma | Type-safe queries, migraciones automaticas, excelente DX |
| **Base de datos** | PostgreSQL 16 | Relacional, JSONB para datos flexibles, full-text search, robusta |
| **Cache** | Redis 7 | Sessions, cache de queries frecuentes, pub/sub para real-time |
| **Archivos** | Cloudflare R2 / AWS S3 | Almacenamiento ilimitado, CDN integrado, presigned URLs |
| **Real-time** | Socket.io | Compatibilidad cross-browser, rooms, reconnection automatica |
| **Validacion** | Zod (ya instalado) | Schemas compartidos frontend/backend |
| **Auth** | JWT + Refresh Tokens | Stateless, escalable, compatible con mobile futuro |

### Opcion B: Supabase (Alternativa rapida)

Para un MVP rapido con menos control pero despliege inmediato:

```
Frontend (React) ──> Supabase
                      ├── PostgreSQL (base de datos)
                      ├── Auth (autenticacion)
                      ├── Storage (archivos)
                      ├── Realtime (WebSockets)
                      └── Edge Functions (logica custom)
```

**Ventajas:** Setup en horas, auth incluido, real-time incluido, storage incluido.
**Desventajas:** Vendor lock-in, menos control, costos escalan rapido.

### Opcion C: NestJS + PostgreSQL (Enterprise)

Para equipos grandes que necesitan estructura estricta:

```
Frontend (React) ──> NestJS
                      ├── Modulos (Boards, Users, Automations)
                      ├── Guards (Auth, Roles)
                      ├── Interceptors (Logging, Transform)
                      ├── TypeORM / Prisma
                      └── WebSocket Gateway
```

**Ventajas:** Arquitectura enterprise, decorators, dependency injection, modular.
**Desventajas:** Mas verbose, curva de aprendizaje, mas boilerplate.

---

## 3. Diseño de Base de Datos

### Diagrama Entidad-Relacion (PostgreSQL)

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│    users     │     │   workspaces     │     │ workspace_   │
│──────────────│     │──────────────────│     │ members      │
│ id (PK)      │     │ id (PK)          │     │──────────────│
│ email        │◄────│ owner_id (FK)    │     │ workspace_id │
│ name         │     │ name             │────►│ user_id      │
│ password_hash│     │ slug             │     │ role         │
│ avatar_url   │     │ icon             │     │ joined_at    │
│ color        │     │ color            │     └──────────────┘
│ job_title    │     │ plan             │
│ phone        │     │ created_at       │
│ created_at   │     └──────────────────┘
│ updated_at   │              │
└──────────────┘              │ 1:N
                              ▼
                    ┌──────────────────┐
                    │     boards       │
                    │──────────────────│
                    │ id (PK)          │
                    │ workspace_id(FK) │     ┌──────────────────┐
                    │ name             │     │    columns       │
                    │ description      │     │──────────────────│
                    │ created_by (FK)  │     │ id (PK)          │
                    │ template         │────►│ board_id (FK)    │
                    │ created_at       │     │ title            │
                    │ updated_at       │     │ type (enum)      │
                    └──────────────────┘     │ width            │
                              │              │ position         │
                              │ 1:N          │ settings (JSONB) │
                              ▼              └──────────────────┘
                    ┌──────────────────┐
                    │     groups       │
                    │──────────────────│
                    │ id (PK)          │
                    │ board_id (FK)    │
                    │ title            │
                    │ color            │
                    │ position         │
                    │ collapsed        │
                    └──────────────────┘
                              │
                              │ 1:N
                              ▼
                    ┌──────────────────┐     ┌──────────────────┐
                    │     items        │     │  column_values   │
                    │──────────────────│     │──────────────────│
                    │ id (PK)          │     │ id (PK)          │
                    │ board_id (FK)    │────►│ item_id (FK)     │
                    │ group_id (FK)    │     │ column_id (FK)   │
                    │ title            │     │ value (JSONB)    │
                    │ position         │     │ updated_at       │
                    │ created_by (FK)  │     └──────────────────┘
                    │ created_at       │
                    │ updated_at       │     ┌──────────────────┐
                    └──────────────────┘     │    comments      │
                              │              │──────────────────│
                              │ 1:N          │ id (PK)          │
                              ├─────────────►│ item_id (FK)     │
                              │              │ author_id (FK)   │
                              │              │ text             │
                              │              │ mentions (JSONB) │
                              │              │ created_at       │
                              │              └──────────────────┘
                              │
                              │ 1:N          ┌──────────────────┐
                              ├─────────────►│  attachments     │
                              │              │──────────────────│
                              │              │ id (PK)          │
                              │              │ item_id (FK)     │
                              │              │ uploaded_by (FK) │
                              │              │ file_name        │
                              │              │ file_size        │
                              │              │ mime_type        │
                              │              │ storage_key      │
                              │              │ url              │
                              │              │ created_at       │
                              │              └──────────────────┘
                              │
                              │ 1:N          ┌──────────────────┐
                              └─────────────►│  subitems        │
                                             │──────────────────│
                                             │ id (PK)          │
                                             │ item_id (FK)     │
                                             │ title            │
                                             │ completed        │
                                             │ position         │
                                             │ created_at       │
                                             └──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  automations     │     │  automation_logs │     │  notifications   │
│──────────────────│     │──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ board_id (FK)    │────►│ automation_id    │     │ user_id (FK)     │
│ name             │     │ board_id         │     │ type (enum)      │
│ trigger (JSONB)  │     │ trigger_type     │     │ title            │
│ action (JSONB)   │     │ action_type      │     │ message          │
│ enabled          │     │ item_id          │     │ board_id         │
│ created_by (FK)  │     │ item_title       │     │ item_id          │
│ execution_count  │     │ result           │     │ author_id        │
│ created_at       │     │ created_at       │     │ read             │
└──────────────────┘     └──────────────────┘     │ created_at       │
                                                   └──────────────────┘

┌──────────────────┐
│  activity_log    │
│──────────────────│
│ id (PK)          │
│ board_id (FK)    │
│ item_id (FK)     │
│ user_id (FK)     │
│ action (enum)    │
│ field            │
│ old_value(JSONB) │
│ new_value(JSONB) │
│ metadata (JSONB) │
│ created_at       │
└──────────────────┘
```

### Prisma Schema (Extracto clave)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum ColumnType {
  STATUS
  PERSON
  DATE
  PRIORITY
  TEXT
  NUMBER
  CHECKBOX
  RATING
  LINK
  TAG
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String   @map("password_hash")
  avatarUrl    String?  @map("avatar_url")
  color        String   @default("#0073ea")
  jobTitle     String?  @map("job_title")
  phone        String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  workspaceMembers WorkspaceMember[]
  boards           Board[]
  comments         Comment[]
  notifications    Notification[]
  activityLogs     ActivityLog[]

  @@map("users")
}

model Workspace {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  icon      String   @default("home")
  color     String   @default("#0073ea")
  ownerId   String   @map("owner_id")
  createdAt DateTime @default(now()) @map("created_at")

  members WorkspaceMember[]
  boards  Board[]

  @@map("workspaces")
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String   @map("workspace_id")
  userId      String   @map("user_id")
  role        Role     @default(MEMBER)
  joinedAt    DateTime @default(now()) @map("joined_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@map("workspace_members")
}

model Board {
  id          String   @id @default(cuid())
  workspaceId String   @map("workspace_id")
  name        String
  description String?
  template    String?
  createdById String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  createdBy   User         @relation(fields: [createdById], references: [id])
  columns     Column[]
  groups      Group[]
  items       Item[]
  automations Automation[]

  @@map("boards")
}

model Item {
  id        String   @id @default(cuid())
  boardId   String   @map("board_id")
  groupId   String   @map("group_id")
  title     String
  position  Int      @default(0)
  createdById String @map("created_by")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  board        Board         @relation(fields: [boardId], references: [id], onDelete: Cascade)
  group        Group         @relation(fields: [groupId], references: [id], onDelete: Cascade)
  columnValues ColumnValue[]
  comments     Comment[]
  attachments  Attachment[]
  subitems     Subitem[]
  activityLogs ActivityLog[]

  @@index([boardId, groupId])
  @@map("items")
}
```

### Indices recomendados para rendimiento

```sql
-- Queries mas frecuentes
CREATE INDEX idx_items_board_group ON items(board_id, group_id);
CREATE INDEX idx_column_values_item ON column_values(item_id);
CREATE INDEX idx_comments_item ON comments(item_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_activity_log_board ON activity_log(board_id, created_at DESC);
CREATE INDEX idx_automations_board ON automations(board_id, enabled);

-- Full-text search
CREATE INDEX idx_items_title_search ON items USING gin(to_tsvector('spanish', title));
CREATE INDEX idx_boards_name_search ON boards USING gin(to_tsvector('spanish', name));
```

---

## 4. Arquitectura de API

### Estructura de endpoints REST

```
API Base: /api/v1

# Autenticacion
POST   /auth/register           Crear cuenta
POST   /auth/login              Iniciar sesion
POST   /auth/refresh            Renovar token
POST   /auth/logout             Cerrar sesion
POST   /auth/forgot-password    Recuperar contraseña

# Usuarios
GET    /users/me                Perfil del usuario actual
PUT    /users/me                Actualizar perfil
PUT    /users/me/preferences    Actualizar preferencias
PUT    /users/me/avatar         Subir avatar

# Espacios de trabajo
GET    /workspaces              Listar mis espacios
POST   /workspaces              Crear espacio
GET    /workspaces/:id          Obtener espacio
PUT    /workspaces/:id          Actualizar espacio
DELETE /workspaces/:id          Eliminar espacio
GET    /workspaces/:id/members  Listar miembros
POST   /workspaces/:id/members  Invitar miembro
PUT    /workspaces/:id/members/:userId   Cambiar rol
DELETE /workspaces/:id/members/:userId   Remover miembro

# Tableros
GET    /boards                  Listar tableros del workspace activo
POST   /boards                  Crear tablero
POST   /boards/import           Importar desde CSV
GET    /boards/:id              Obtener tablero completo (items, columns, groups)
PUT    /boards/:id              Actualizar tablero
DELETE /boards/:id              Eliminar tablero
POST   /boards/:id/duplicate    Duplicar tablero

# Columnas
POST   /boards/:id/columns      Agregar columna
PUT    /boards/:id/columns/:colId  Actualizar columna
DELETE /boards/:id/columns/:colId  Eliminar columna

# Grupos
POST   /boards/:id/groups       Crear grupo
PUT    /boards/:id/groups/:gId  Actualizar grupo
DELETE /boards/:id/groups/:gId  Eliminar grupo
PUT    /boards/:id/groups/reorder  Reordenar grupos

# Items
POST   /boards/:id/items        Crear item
PUT    /boards/:id/items/:itemId  Actualizar item
DELETE /boards/:id/items/:itemId  Eliminar item
PUT    /boards/:id/items/reorder  Reordenar items
PUT    /boards/:id/items/:itemId/move  Mover a otro grupo
PUT    /boards/:id/items/:itemId/columns/:colId  Actualizar valor de columna

# Sub-items
POST   /items/:itemId/subitems          Crear sub-item
PUT    /items/:itemId/subitems/:subId   Actualizar
DELETE /items/:itemId/subitems/:subId   Eliminar

# Comentarios
GET    /items/:itemId/comments   Listar comentarios
POST   /items/:itemId/comments   Agregar comentario
DELETE /comments/:commentId      Eliminar comentario

# Archivos
POST   /items/:itemId/attachments   Subir archivo (multipart)
DELETE /attachments/:attachmentId   Eliminar archivo
GET    /attachments/:attachmentId/url  Obtener URL temporal (presigned)

# Automatizaciones
GET    /boards/:id/automations      Listar automatizaciones
POST   /boards/:id/automations      Crear automatizacion
PUT    /automations/:autoId         Actualizar automatizacion
DELETE /automations/:autoId         Eliminar
PUT    /automations/:autoId/toggle  Activar/desactivar
GET    /boards/:id/automations/logs Historial de ejecucion

# Notificaciones
GET    /notifications               Listar (paginadas)
PUT    /notifications/:id/read      Marcar leida
PUT    /notifications/read-all      Marcar todas leidas
DELETE /notifications/:id           Eliminar

# Dashboard
GET    /dashboard/stats             Estadisticas globales
GET    /dashboard/widgets           Obtener widgets del usuario
PUT    /dashboard/widgets           Guardar layout de widgets

# Busqueda
GET    /search?q=texto              Busqueda global (boards, items, comments)

# Actividad
GET    /boards/:id/activity         Log de actividad del tablero
GET    /activity/me                 Mi actividad reciente
```

### Estructura del proyecto backend

```
server/
├── src/
│   ├── app.ts                   # Setup de Fastify + plugins
│   ├── server.ts                # Entry point
│   ├── config/
│   │   ├── env.ts               # Variables de entorno validadas con Zod
│   │   ├── database.ts          # Conexion PostgreSQL via Prisma
│   │   └── redis.ts             # Conexion Redis
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts   # Zod schemas
│   │   │   └── auth.middleware.ts
│   │   ├── boards/
│   │   │   ├── boards.routes.ts
│   │   │   ├── boards.service.ts
│   │   │   └── boards.schema.ts
│   │   ├── items/
│   │   │   ├── items.routes.ts
│   │   │   ├── items.service.ts
│   │   │   └── items.schema.ts
│   │   ├── automations/
│   │   │   ├── automations.routes.ts
│   │   │   ├── automations.service.ts
│   │   │   ├── automations.engine.ts  # Motor de ejecucion
│   │   │   └── automations.schema.ts
│   │   ├── notifications/
│   │   │   ├── notifications.routes.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── notifications.schema.ts
│   │   ├── search/
│   │   │   ├── search.routes.ts
│   │   │   └── search.service.ts
│   │   └── uploads/
│   │       ├── uploads.routes.ts
│   │       └── uploads.service.ts  # S3 presigned URLs
│   ├── realtime/
│   │   ├── socket.ts            # Socket.io setup
│   │   ├── rooms.ts             # Board rooms management
│   │   └── events.ts            # Event handlers
│   ├── jobs/
│   │   ├── queue.ts             # BullMQ job queue
│   │   ├── automation.job.ts    # Ejecutar automatizaciones
│   │   ├── notification.job.ts  # Enviar notificaciones
│   │   └── cleanup.job.ts       # Limpieza periodica
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   ├── rbac.ts              # Role-based access control
│   │   ├── rateLimit.ts         # Rate limiting
│   │   └── errorHandler.ts      # Error handling global
│   └── utils/
│       ├── logger.ts            # Pino logger
│       ├── errors.ts            # Custom error classes
│       └── pagination.ts        # Helpers de paginacion
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                  # Datos iniciales
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── tsconfig.json
└── package.json
```

---

## 5. Autenticacion y Seguridad

### Flujo de autenticacion JWT

```
1. Login
   Cliente ──POST /auth/login──> Server
                                  ├── Valida credenciales
                                  ├── Genera Access Token (15min)
                                  ├── Genera Refresh Token (7d)
                                  └── Set httpOnly cookie (refresh)
   Cliente <── { accessToken } ──

2. Request autenticado
   Cliente ──GET /boards──> Server
   Headers: Authorization: Bearer <accessToken>
                            ├── Verifica JWT
                            ├── Extrae userId
                            └── Responde data

3. Token refresh
   Cliente ──POST /auth/refresh──> Server
   Cookie: refreshToken              ├── Verifica refresh token
                                     ├── Rota refresh token
                                     └── Genera nuevo access token
   Cliente <── { accessToken } ──
```

### Seguridad implementada

| Medida | Implementacion |
|---|---|
| Passwords | bcrypt con salt rounds: 12 |
| JWT | RS256, access: 15min, refresh: 7d |
| CORS | Whitelist de origenes permitidos |
| Rate limiting | 100 req/min general, 5/min para login |
| RBAC | Owner > Admin > Member > Viewer por workspace |
| Input validation | Zod schemas en cada endpoint |
| SQL injection | Prisma parametriza todas las queries |
| XSS | Sanitizacion de HTML en comentarios |
| CSRF | SameSite cookies + double-submit |
| Headers | Helmet.js (X-Frame-Options, CSP, HSTS) |
| File upload | Validacion MIME, limite 10MB, solo tipos permitidos |

### Permisos por rol (RBAC)

```
Accion                  | Owner | Admin | Member | Viewer
─────────────────────────────────────────────────────────
Workspace: eliminar     |   ✓   |       |        |
Workspace: configurar   |   ✓   |   ✓   |        |
Miembros: invitar       |   ✓   |   ✓   |        |
Miembros: cambiar rol   |   ✓   |   ✓   |        |
Tablero: crear          |   ✓   |   ✓   |   ✓    |
Tablero: eliminar       |   ✓   |   ✓   |        |
Tablero: editar         |   ✓   |   ✓   |   ✓    |
Items: crear/editar     |   ✓   |   ✓   |   ✓    |
Items: eliminar         |   ✓   |   ✓   |   ✓    |
Comentarios: crear      |   ✓   |   ✓   |   ✓    |   ✓
Automatizaciones        |   ✓   |   ✓   |        |
Solo lectura            |   ✓   |   ✓   |   ✓    |   ✓
```

---

## 6. Infraestructura y Despliegue

### Arquitectura de despliegue recomendada

```
                        ┌─────────────────┐
                        │   Cloudflare    │
                        │   DNS + CDN     │
                        └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
           ┌────────┴────────┐    ┌──────────┴──────────┐
           │   Vercel        │    │   Railway / Render   │
           │   (Frontend)    │    │   (Backend API)      │
           │   React SPA     │    │   Node.js + Fastify  │
           └─────────────────┘    └──────────┬──────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              │                              │
                    ┌─────────┴─────────┐    ┌──────────────┴──────┐
                    │   Neon / Supabase │    │   Upstash Redis     │
                    │   PostgreSQL      │    │   (Serverless)      │
                    │   (Serverless)    │    │                     │
                    └───────────────────┘    └─────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        │   Cloudflare R2       │
                        │   (File Storage)      │
                        └───────────────────────┘
```

### Opciones de hosting con costos estimados

#### Tier 1: Startup (0-100 usuarios) - ~$0-25/mes

| Servicio | Proveedor | Plan | Costo |
|---|---|---|---|
| Frontend | Vercel | Hobby/Pro | $0-20 |
| Backend | Railway | Starter | $0-5 |
| PostgreSQL | Neon | Free (0.5GB) | $0 |
| Redis | Upstash | Free (10K cmd/dia) | $0 |
| Storage | Cloudflare R2 | Free (10GB) | $0 |

#### Tier 2: Crecimiento (100-1000 usuarios) - ~$50-150/mes

| Servicio | Proveedor | Plan | Costo |
|---|---|---|---|
| Frontend | Vercel | Pro | $20 |
| Backend | Railway | Pro (8GB RAM) | $20-40 |
| PostgreSQL | Neon | Launch (10GB) | $19 |
| Redis | Upstash | Pro | $10 |
| Storage | Cloudflare R2 | Pay-as-you-go | $5-15 |
| Monitoring | Sentry | Team | $26 |

#### Tier 3: Scale (1000+ usuarios) - ~$200-500/mes

| Servicio | Proveedor | Plan | Costo |
|---|---|---|---|
| Frontend | Vercel | Enterprise | $50+ |
| Backend | AWS ECS / GCP Cloud Run | Auto-scale | $50-150 |
| PostgreSQL | AWS RDS / Neon Scale | 50GB+ | $50-100 |
| Redis | AWS ElastiCache | t3.small | $25 |
| Storage | AWS S3 | Pay-as-you-go | $10-30 |
| CDN | Cloudflare | Pro | $20 |
| Monitoring | Datadog / Sentry | Team | $50+ |

### Docker Compose (desarrollo local)

```yaml
# docker-compose.yml
version: '3.9'

services:
  api:
    build: ./server
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://workos:workos@postgres:5432/workos
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - S3_BUCKET=${S3_BUCKET}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: workos
      POSTGRES_USER: workos
      POSTGRES_PASSWORD: workos
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  pgadmin:
    image: dpage/pgadmin4
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@workos.com
      PGADMIN_DEFAULT_PASSWORD: admin

volumes:
  pgdata:
```

---

## 7. Tiempo Real y Colaboracion

### Arquitectura WebSocket con Socket.io

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Usuario A   │     │  Usuario B   │     │  Usuario C   │
│  (Tablero 1) │     │  (Tablero 1) │     │  (Tablero 2) │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       └────────┬───────────┘                     │
                │                                 │
    ┌───────────┴──────────┐          ┌───────────┴──────────┐
    │   Room: board-1      │          │   Room: board-2      │
    │   Socket.io Room     │          │   Socket.io Room     │
    └───────────┬──────────┘          └──────────────────────┘
                │
    ┌───────────┴──────────┐
    │   Redis Pub/Sub      │  (Para multiples instancias del server)
    │   @socket.io/        │
    │   redis-adapter      │
    └──────────────────────┘
```

### Eventos en tiempo real

```javascript
// Eventos que el servidor emite a los rooms

// Board events
'board:updated'        -> { boardId, changes }
'board:deleted'        -> { boardId }

// Item events
'item:created'         -> { boardId, groupId, item }
'item:updated'         -> { boardId, itemId, changes }
'item:deleted'         -> { boardId, itemId }
'item:moved'           -> { boardId, itemId, fromGroup, toGroup }
'item:reordered'       -> { boardId, groupId, itemIds }

// Column value events
'columnValue:updated'  -> { boardId, itemId, columnId, value, userId }

// Comment events
'comment:added'        -> { boardId, itemId, comment }
'comment:deleted'      -> { boardId, itemId, commentId }

// Presence events (quienes estan viendo el tablero)
'presence:join'        -> { boardId, user }
'presence:leave'       -> { boardId, userId }
'presence:cursor'      -> { boardId, userId, cellId }  // Cursor colaborativo

// Notification events
'notification:new'     -> { notification }
```

### Resolucion de conflictos

Para edicion concurrente, se recomienda **Last Write Wins (LWW)** con timestamp:

```javascript
// Cada cambio incluye timestamp del cliente
{
  itemId: "item-1",
  columnId: "status",
  value: "done",
  timestamp: 1708100000000,
  userId: "user-1"
}

// Server compara timestamps y aplica el mas reciente
// + Notifica a otros usuarios del cambio
```

Para fase avanzada: **CRDTs** (Conflict-free Replicated Data Types) con Yjs para edicion de texto colaborativo.

---

## 8. Almacenamiento de Archivos

### Migracion de base64 a Object Storage

**Estado actual:** Archivos guardados como base64 en localStorage (~1.33x el tamaño original).

**Solucion:** Presigned URLs con Cloudflare R2 o AWS S3.

```
┌─────────┐   1. Request upload URL    ┌─────────┐
│ Frontend │ ────────────────────────>  │ Backend │
│          │   2. Presigned PUT URL     │         │
│          │ <────────────────────────  │         │
│          │                            │         │
│          │   3. PUT file directly     │         │
│          │ ─────────────────────────> │   S3    │
│          │   4. Confirm upload        │   / R2  │
│          │ ────────────────────────>  │         │
│          │   5. Save metadata in DB   │         │
└─────────┘                            └─────────┘

// Lectura
Frontend ──> Backend (get presigned READ URL) ──> S3/R2
```

### Estructura de almacenamiento

```
workos-files/
├── {workspaceId}/
│   ├── boards/{boardId}/
│   │   ├── items/{itemId}/
│   │   │   ├── attachments/
│   │   │   │   ├── {uuid}-original-filename.pdf
│   │   │   │   └── {uuid}-photo.jpg
│   │   │   └── thumbnails/       # Generados automaticamente
│   │   │       └── {uuid}-photo-thumb.webp
│   │   └── exports/
│   └── avatars/
│       └── {userId}-avatar.webp
```

---

## 9. Mejoras de Diseño UI/UX

### 9.1 Mejoras inmediatas (Sprint 1-2)

#### Sistema de temas completo (Dark mode)

```css
/* Extender @theme en index.css para dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: #1e1e2e;
    --color-surface-secondary: #181825;
    --color-text-primary: #cdd6f4;
    --color-text-secondary: #a6adc8;
    --color-border: #313244;
    --color-border-light: #45475a;
    --color-sidebar-bg: #11111b;
  }
}
```

**Archivos a modificar:** `index.css`, `uiStore.js` (aplicar clase al document root).

#### Skeleton loaders

Reemplazar el spinner actual por skeletons contextuales:

```jsx
// Skeleton para filas de tablero
function BoardRowSkeleton({ columns }) {
  return (
    <div className="flex items-center border-b border-border-light animate-pulse">
      <div className="w-8 px-1 py-3"><div className="h-4 w-4 bg-surface-secondary rounded" /></div>
      <div className="flex-1 min-w-[250px] px-3 py-3"><div className="h-4 w-48 bg-surface-secondary rounded" /></div>
      {columns.map((_, i) => (
        <div key={i} className="w-[130px] px-1 py-3"><div className="h-6 w-20 bg-surface-secondary rounded mx-auto" /></div>
      ))}
    </div>
  );
}
```

#### Transiciones de pagina

```jsx
// Usar framer-motion (ya instalado) para transiciones entre rutas
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};
```

#### Feedback de acciones mejorado

- Confirmacion con modal para acciones destructivas (eliminar tablero, miembro)
- Undo toast para eliminaciones (3s para deshacer)
- Progress indicator para importacion CSV

### 9.2 Mejoras de media plazo (Sprint 3-4)

#### Onboarding wizard para nuevos usuarios

```
Paso 1: Bienvenida + Nombre del workspace
Paso 2: Invitar miembros del equipo
Paso 3: Elegir plantilla de primer tablero
Paso 4: Tutorial interactivo con tooltips
```

#### Personalización de tableros

- **Colores de fondo** por tablero
- **Iconos** seleccionables por tablero (usar lucide icons)
- **Cover images** para tableros en vista grid
- **Favoritos** con estrella para acceso rapido

#### Mejoras al Kanban

- **WIP limits** (limite de tarjetas por columna)
- **Swimlanes** (agrupar por persona, prioridad)
- **Quick filters** en la vista kanban
- **Card templates** para crear items predefinidos

#### Mejoras al editor de comentarios

```
Reemplazar input basico por editor rich-text:
- @menciones con dropdown autocompletado
- Formato basico (bold, italic, lists)
- Previsualizacion de links (embeds)
- Emojis picker
- Drag-drop de imagenes directamente
```

### 9.3 Mejoras de largo plazo (Sprint 5+)

#### Vista de formulario

Crear formularios publicos para recopilar datos directamente en un tablero:
- URL publica compartible
- Campos mapeados a columnas
- Validacion configurable
- Branding personalizable

#### Timeline mejorado

- **Dependencias** entre items (lineas de conexion)
- **Hitos** (milestones con diamantes)
- **Baseline** (plan original vs actual)
- **Zoom** (dia, semana, mes, trimestre)

#### Accesibilidad (a11y)

- Soporte completo de teclado para navegacion
- ARIA labels en todos los componentes interactivos
- Focus visible mejorado
- Screen reader compatible
- Contraste WCAG AA en todos los estados de color

---

## 10. Mejoras de Frontend

### 10.1 Migracion a TypeScript

**Prioridad: Alta** - Previene bugs y mejora la mantenibilidad.

```
Orden de migracion recomendado:
1. lib/ (constants.ts, utils.ts)        - Tipos base compartidos
2. stores/ (boardStore.ts, etc.)        - Interfaces de datos
3. components/ui/ (Button, Avatar)      - Props tipadas
4. components/board/columns/            - Cell types
5. components/board/ (BoardRow, etc.)   - Board components
6. pages/                               - Paginas
7. components/layout/                   - Layout
```

**Tipos clave a definir:**

```typescript
// types/board.ts
interface Board {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  columns: Column[];
  groups: Group[];
  items: Item[];
  createdAt: string;
  updatedAt: string;
}

interface Item {
  id: string;
  groupId: string;
  title: string;
  columnValues: Record<string, unknown>;
  subitems: Subitem[];
  comments: Comment[];
  attachments: Attachment[];
  activityLog: Activity[];
  createdAt: string;
  updatedAt: string;
}

// Discriminated union para column values
type ColumnValue =
  | { type: 'status'; value: StatusKey }
  | { type: 'person'; value: string }
  | { type: 'date'; value: string }
  | { type: 'priority'; value: PriorityKey }
  | { type: 'number'; value: number }
  | { type: 'checkbox'; value: boolean }
  | { type: 'rating'; value: number }
  | { type: 'text'; value: string }
  | { type: 'link'; value: string }
  | { type: 'tag'; value: string[] };
```

### 10.2 Testing

```
Framework recomendado:
├── Vitest              # Unit tests (compatible con Vite)
├── React Testing Lib   # Component tests
├── Playwright          # E2E tests
└── MSW                 # API mocking

Cobertura objetivo:
├── stores/     → 90%+ (logica de negocio critica)
├── lib/utils   → 95%+ (funciones puras)
├── components/ → 70%+ (interacciones principales)
└── pages/      → 60%+ (flujos criticos E2E)
```

### 10.3 Performance

| Mejora | Implementacion | Impacto |
|---|---|---|
| Virtualizacion de listas | `@tanstack/react-virtual` para tableros >100 items | Alto |
| Memoizacion de celdas | `React.memo` + `useMemo` en BoardRow/cells | Medio |
| Debounce de updates | Debounce 300ms en edicion inline de celdas | Medio |
| Image lazy loading | `loading="lazy"` en avatares y thumbnails | Bajo |
| Service Worker | Cache de assets estaticos (offline-first) | Medio |
| Bundle analysis | `rollup-plugin-visualizer` para optimizar chunks | Medio |

### 10.4 Monorepo (si el equipo crece)

```
workos/
├── apps/
│   ├── web/           # React frontend (actual shatter-protektor)
│   ├── api/           # Fastify backend
│   └── docs/          # Documentacion (Docusaurus/Nextra)
├── packages/
│   ├── shared/        # Tipos, schemas Zod, constantes
│   ├── ui/            # Componentes UI compartidos
│   └── utils/         # Utilidades compartidas
├── turbo.json         # Turborepo config
└── package.json
```

---

## 11. Plan de Migracion

### Estrategia: Migración incremental (Strangler Fig Pattern)

No reescribir todo de golpe. Migrar store por store:

```
Fase 1: Backend minimo + Auth
  ├── Setup Fastify + Prisma + PostgreSQL
  ├── Auth (register, login, JWT)
  ├── Migrar userStore → API
  └── Frontend: Login page + auth context

Fase 2: Core boards
  ├── API para boards CRUD
  ├── API para items CRUD
  ├── API para columns + column values
  ├── Migrar boardStore → React Query + API
  └── Importar datos existentes de localStorage

Fase 3: Colaboracion
  ├── Socket.io setup
  ├── Board rooms + presence
  ├── Real-time item updates
  └── Migrar workspaceStore → API

Fase 4: Features secundarios
  ├── Comments API + real-time
  ├── File uploads (S3)
  ├── Migrar notificationStore → API
  ├── Migrar automationStore → API (server-side execution)
  └── Migrar dashboardStore → API

Fase 5: Optimizacion
  ├── Redis caching
  ├── Full-text search con PostgreSQL
  ├── Background jobs (BullMQ)
  ├── Rate limiting
  └── Monitoring + logging
```

### Compatibilidad durante migracion

```javascript
// Patron para migrar un store gradualmente
// boardService.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api'; // Axios/fetch wrapper

// Antes: useBoardStore().boards
// Despues: useBoards().data

export function useBoards(workspaceId) {
  return useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => api.get(`/boards?workspaceId=${workspaceId}`),
    staleTime: 30_000,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/boards', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
    // Optimistic update para UX instantanea
    onMutate: async (newBoard) => {
      await queryClient.cancelQueries({ queryKey: ['boards'] });
      const previous = queryClient.getQueryData(['boards']);
      queryClient.setQueryData(['boards'], (old) => [...old, { ...newBoard, id: 'temp' }]);
      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['boards'], context.previous);
    },
  });
}
```

---

## 12. Roadmap por Fases

### Fase 1: MVP Backend (4-6 semanas)

```
Semana 1-2: Fundamentos
  □ Setup proyecto Node.js + Fastify + TypeScript
  □ Configurar Prisma + PostgreSQL
  □ Schema de base de datos (migracion inicial)
  □ Docker Compose para desarrollo local
  □ Auth: registro, login, JWT, refresh tokens
  □ RBAC middleware

Semana 3-4: Core API
  □ CRUD completo de Boards
  □ CRUD completo de Items + Column Values
  □ CRUD de Groups y Columns
  □ Reorder endpoints (drag & drop)
  □ Seed data para testing

Semana 5-6: Integracion Frontend
  □ Crear api.js (Axios client con interceptors)
  □ Migrar boardStore a React Query
  □ Login/Register pages
  □ Auth context + protected routes
  □ Migrar localStorage a PostgreSQL (script de migracion)
```

### Fase 2: Colaboracion (3-4 semanas)

```
Semana 7-8: Real-time
  □ Socket.io setup en el backend
  □ Board rooms (join/leave)
  □ Real-time item updates
  □ Presence indicators ("Juan esta viendo este tablero")
  □ Optimistic updates con reconciliacion

Semana 9-10: Features sociales
  □ Comments API con menciones
  □ Notificaciones API (reemplazar store local)
  □ Email notifications (Resend / Nodemailer)
  □ Activity log server-side
  □ Workspace invitations por email
```

### Fase 3: Archivos y Automatizaciones (3-4 semanas)

```
Semana 11-12: Archivos
  □ S3/R2 setup con presigned URLs
  □ Upload de archivos (multipart)
  □ Thumbnails automaticos (Sharp)
  □ Avatar upload
  □ Migrar base64 attachments a S3

Semana 13-14: Automatizaciones server-side
  □ BullMQ job queue setup
  □ Motor de automatizaciones en el servidor
  □ Cron jobs para "date_arrived" triggers
  □ Webhook actions (notificar servicios externos)
  □ Dashboard stats API
```

### Fase 4: Polish y Scale (Continuo)

```
□ Dark mode completo
□ TypeScript migration del frontend
□ Vitest + Playwright tests
□ Virtualizacion de listas grandes
□ Full-text search con PostgreSQL
□ Redis caching layer
□ Rate limiting + abuse protection
□ Monitoring (Sentry + logs)
□ CI/CD pipeline (GitHub Actions)
□ Documentacion API (Swagger/OpenAPI)
□ Mobile responsive improvements
□ PWA (Service Worker + manifest)
□ Internacionalizacion (i18n) completa
□ Formularios publicos
□ Integraciones (Slack, Email, Webhooks)
□ Exportar a PDF/Excel
```

---

## Variables de Entorno Necesarias

```env
# .env.example

# Server
PORT=4000
NODE_ENV=development
API_URL=http://localhost:4000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/workos

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Storage (Cloudflare R2 / AWS S3)
S3_ENDPOINT=https://account.r2.cloudflarestorage.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=workos-files
S3_PUBLIC_URL=https://files.yourapp.com

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourapp.com

# Frontend URL (para CORS y emails)
CLIENT_URL=http://localhost:3000

# Sentry (monitoring)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## Resumen Ejecutivo

| Aspecto | Actual | Propuesto |
|---|---|---|
| **Datos** | localStorage (5-10MB) | PostgreSQL (ilimitado) |
| **Auth** | Sin autenticacion | JWT + RBAC |
| **Archivos** | Base64 en localStorage | S3/R2 presigned URLs |
| **Colaboracion** | Single-user | Multi-user real-time |
| **Busqueda** | Client-side filter | Full-text PostgreSQL |
| **Automatizaciones** | Client-side only | Server-side + cron jobs |
| **Notificaciones** | localStorage | Push + Email + In-app |
| **Backup** | Ninguno | DB backups automaticos |
| **Monitoring** | Ninguno | Sentry + structured logs |
| **Deploy** | Manual | CI/CD automatizado |
| **Costo inicial** | $0 | $0-25/mes (tier gratis) |
