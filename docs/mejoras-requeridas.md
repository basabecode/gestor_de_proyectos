# Plan de Mejoras — Work OS (Gestor de Proyectos)

> Análisis comparativo entre la investigación técnica (`investigacion_gestionproyectos.txt`) y el estado actual del proyecto.
> Fecha: 2026-03-01

---

## ESTADO ACTUAL

| Aspecto | Estado |
|---|---|
| Framework | React 19 + Vite 7 + Tailwind CSS v4 |
| Persistencia | localStorage (sin backend) |
| Auth | Ninguna (usuario fijo hardcoded) |
| Colaboración | Simulada (miembros hardcoded) |
| Jerarquía de datos | Workspace > Board > Group > Item |
| Métricas | Ninguna (CPI/SPI/presupuesto ausentes) |
| IA | No implementada |
| Multi-tenancy | No implementada |
| RBAC | Roles definidos pero no aplicados |

---

## MEJORAS PRIORITARIAS

### 🔴 CRÍTICO — P0 (Sin estas, no es un producto real)

#### M-01: Conectar Supabase como backend real
- **Brecha**: Todo persiste en localStorage → datos se pierden al limpiar caché, no hay colaboración real
- **Solución**: Migrar Zustand stores a Supabase (PostgreSQL)
- **Impacto**: Habilita colaboración, historial, backups, multi-dispositivo
- **Skill**: `/supabase-migration`
- **MCP**: Supabase ya configurado en `~/.claude/settings.json` ✅

#### M-02: Autenticación real (Supabase Auth)
- **Brecha**: `currentUser` es hardcoded (`admin@workos.com`), cualquiera accede a todo
- **Solución**: Supabase Auth con email/contraseña + OAuth (Google, GitHub)
- **Impacto**: Seguridad básica, identidad real de usuarios
- **Skill**: `/auth-supabase`

#### M-03: RBAC funcional (Control de Acceso por Roles)
- **Brecha**: Roles definidos (`owner/admin/member/viewer`) pero no se aplican en la UI ni en datos
- **Solución**: Row Level Security (RLS) en Supabase + guardas en componentes React
- **Impacto**: Los viewers no pueden editar, solo los owners pueden borrar workspaces
- **Skill**: `/rbac-workos`

---

### 🟠 ALTO — P1 (Diferenciadores de producto)

#### M-04: Integración de IA (Claude API vía Vercel AI SDK)
- **Brecha**: No existe asistencia inteligente para la gestión
- **Solución**: Chat IA contextual, generación automática de tareas, resúmenes de proyecto, detección de riesgos
- **Impacto**: Principal diferenciador frente a Jira/Trello/Asana
- **Skill**: `/ai-pm-assistant`
- **MCP**: Vercel ya conectado ✅

#### M-05: Métricas PMIS (CPI, SPI, presupuesto)
- **Brecha**: Sin métricas de rendimiento de proyecto (solo % completado)
- **Solución**: Campos de costo estimado/real, captura de snapshots de progreso, cálculo de CPI y SPI
- **Fórmulas**:
  - `CPI = EV / AC` (Earned Value / Actual Cost)
  - `SPI = EV / PV` (Earned Value / Planned Value)
- **Skill**: `/pmis-metrics`

#### M-06: Jerarquía de Portfolio completa
- **Brecha**: Jerarquía actual = Workspace > Board. La investigación propone Org > Portfolio > Programa > Proyecto > Tarea
- **Solución**: Agregar entidades Portfolio y Programa en el modelo de datos
- **Impacto**: Gestión empresarial real, PMO (Project Management Office)

#### M-07: Gestión de Riesgos
- **Brecha**: No existe módulo de riesgos
- **Solución**: Clase `Risk` con probabilidad, impacto, tarea vinculada y plan de mitigación
- **Impacto**: "Lente de Riesgo" que resalta ítems críticos en rojo

---

### 🟡 MEDIO — P2 (UX y funcionalidades avanzadas)

#### M-08: Dashboard de Salud de Proyecto con Heatmap
- **Brecha**: Dashboard actual tiene 4 métricas estáticas
- **Solución**: Indicadores visuales de "calor" (alcance, tiempo, presupuesto) + línea histórica predictiva
- **Tecnología**: Recharts (ya instalado) + Supabase snapshots

#### M-09: WIP Limits en Kanban
- **Brecha**: Kanban sin límites de trabajo en progreso
- **Solución**: Configurar límite por columna; tarjetas cambian de color según carga del asignado
- **Impacto**: Metodología Lean visible en tiempo real

#### M-10: Canvas Híbrido Gantt + Kanban
- **Brecha**: Gantt y Kanban son vistas separadas
- **Solución**: Panel dividido (split screen) que muestre Gantt izquierda / Kanban derecha
- **Impacto**: Gestores ven estructura rígida; equipo ejecuta en modo ágil

#### M-11: Vistas de Lente (Lens Views)
- **Brecha**: Cambiar vistas recarga la página
- **Solución**: Filtros visuales profundos sobre el mismo canvas (Lente Riesgo, Lente Carga, Lente Fecha)
- **Impacto**: UX única diferenciadora

#### M-12: Notificaciones push reales
- **Brecha**: Solo toasts locales (react-hot-toast), sin persistencia ni push
- **Solución**: Supabase Realtime para suscripciones en vivo + notificaciones del navegador (Web Push API)

#### M-13: Búsqueda global mejorada (Ctrl+K)
- **Brecha**: `SearchPalette` existe pero busca solo en boards locales
- **Solución**: Conectar a Supabase full-text search (PostgreSQL `tsvector`)

---

### 🟢 BAJO — P3 (SaaS & Monetización)

#### M-14: Multi-workspace / Multi-tenancy
- **Brecha**: `workspaceStore` existe pero sin aislamiento real de datos entre organizaciones
- **Solución**: `organization_id` en todas las tablas Supabase + RLS por organización
- **Skill**: `/multitenancy-setup`

#### M-15: Sistema de Pagos (Stripe)
- **Brecha**: No hay modelo de negocio implementado
- **Solución**: Stripe Checkout + Webhooks para planes (Free/Pro/Enterprise)
- **Integración**: Supabase Edge Function para webhooks de Stripe

#### M-16: SSO / Identidad Federada
- **Brecha**: Solo auth local
- **Solución**: SAML SSO vía Supabase Auth o Logto para clientes enterprise

#### M-17: Jobs en segundo plano
- **Brecha**: Sin procesamiento asíncrono
- **Solución**: Supabase Edge Functions + pg_cron para reportes, recordatorios, facturación

#### M-18: Aprovisionamiento automático de organizaciones
- **Brecha**: Crear workspace es manual
- **Solución**: Flow automatizado: registro → crear organización → invitar miembros → template inicial

---

## RESUMEN DE BRECHAS POR PILAR

| Pilar Investigación | Brecha Actual | Mejoras |
|---|---|---|
| Multi-tenancy | Sin aislamiento real | M-14, M-03 |
| Backend/BaaS | Solo localStorage | M-01, M-02 |
| Autenticación/RBAC | Hardcoded | M-02, M-03, M-16 |
| IA | Ausente | M-04 |
| Métricas PMIS | Solo % completado | M-05, M-08 |
| Jerarquía de datos | Sin Portfolio/Programa | M-06 |
| Gestión de riesgos | Ausente | M-07 |
| UX diferenciadora | Vistas estándar | M-08 a M-11 |
| Monetización | Sin modelo SaaS | M-15, M-18 |
| Background jobs | Ausente | M-17 |

---

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

```
Sprint 1: M-01 (Supabase) → M-02 (Auth) → M-03 (RBAC)
Sprint 2: M-04 (IA) → M-05 (PMIS) → M-06 (Portfolio)
Sprint 3: M-07 (Riesgos) → M-08 (Health Dashboard) → M-09 (WIP)
Sprint 4: M-10 (Híbrido) → M-11 (Lentes) → M-12 (Push)
Sprint 5: M-14 (Multi-tenant) → M-15 (Stripe) → M-17 (Jobs)
```

---

## CONEXIONES MCP DISPONIBLES Y REQUERIDAS

### ✅ Ya configurados
| MCP | Token/Ref | Uso |
|---|---|---|
| Supabase | `izzskaphzvjcojzrohqr` | DB, Auth, Storage, Realtime |
| Vercel | Integrado en Claude | Deploy, Logs, Preview |

### 📋 Recomendados para agregar
| MCP | Instalación | Uso |
|---|---|---|
| GitHub | `gh extension install github/gh-mcp` | Control de versiones, PRs |
| Stripe | MCP oficial de Stripe | Gestión de pagos y planes |

---

## SKILLS CREADOS PARA ESTE PROYECTO

| Skill | Comando | Descripción |
|---|---|---|
| Migración Supabase | `/supabase-migration` | Migrar stores de localStorage a Supabase |
| Auth Supabase | `/auth-supabase` | Implementar autenticación real |
| RBAC Work OS | `/rbac-workos` | Aplicar roles en UI y base de datos |
| Asistente IA PM | `/ai-pm-assistant` | Integrar Claude como copiloto de proyectos |
| Métricas PMIS | `/pmis-metrics` | Agregar CPI, SPI y gestión de presupuesto |
