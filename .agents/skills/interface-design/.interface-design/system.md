# Sistema de Diseño: Workshop
**SomosTécnicos - Interface Design System**

---

## Intent

### Quién es el humano

**Panel Administrativo:**
- Manager de operaciones de servicio técnico
- Trabaja 8am-6pm monitoreando múltiples técnicos en campo
- Necesita detectar urgencias y resolver cuellos de botella rápidamente
- Toma decisiones de asignación basadas en zona, disponibilidad y urgencia

**Panel Cliente:**
- Dueño de casa con electrodoméstico dañado
- Preocupado por el problema, necesita solución rápida
- Quiere saber cuándo llegará el técnico y poder comunicarse
- Busca tranquilidad y confianza en el servicio

**Panel Técnico:**
- Técnico en campo con herramientas en camioneta
- Entre servicios, usando celular para ver próximo trabajo
- Necesita navegar rápido, ver detalles, actualizar estado
- Prioriza eficiencia y claridad de información

### Qué deben lograr

**Admin:** Asignar técnicos óptimamente, resolver urgencias, monitorear operación en tiempo real
**Cliente:** Rastrear servicio, contactar técnico, tener tranquilidad sobre el progreso
**Técnico:** Ver próximo trabajo, navegar a ubicación, actualizar estado, contactar cliente

### Cómo debe sentirse

**Admin:** Comando y control - como un centro de despacho de emergencias profesional
**Cliente:** Confianza y tranquilidad - como rastrear un paquete importante pero más personal
**Técnico:** Eficiencia operativa - como app de delivery pero para servicios técnicos

---

## Domain Exploration

### Conceptos del Dominio

1. **Despacho y Asignación** - Centro de control que coordina técnicos y órdenes
2. **Ruta y Zona** - Geografía de cobertura, optimización de desplazamientos
3. **Urgencia y Prioridad** - Clasificación de servicios por criticidad
4. **Herramientas y Especialidades** - Equipamiento técnico específico
5. **Taller y Campo** - Dualidad entre base de operaciones y trabajo en terreno
6. **Disponibilidad y Estado** - Técnicos en tiempo real (disponible/ocupado/descanso)
7. **Timeline de Servicio** - Progreso desde solicitud hasta completado
8. **Garantía y Calidad** - Respaldo profesional del trabajo realizado

### Color World

Colores que existen naturalmente en el mundo del servicio técnico:

1. **Naranja de Herramientas** - Destornilladores, cajas de herramientas, equipamiento
2. **Azul de Uniformes** - Overoles técnicos, camisas de trabajo profesional
3. **Rojo de Urgencia** - Sellos urgentes, alertas, prioridad alta
4. **Verde de Completado** - Checkmarks, trabajos finalizados, garantía
5. **Gris Metálico** - Estructuras, marcos, equipos, profesionalismo
6. **Amarillo de Seguridad** - Chalecos, advertencias, precaución
7. **Blanco de Limpieza** - Superficies limpias, profesionalismo, orden
8. **Concreto de Taller** - Piso de taller, base de operaciones

### Signature Element

**Dispatch Board (Tablero de Despacho)**

Elemento único que solo puede existir para SomosTécnicos:

- Mapa en tiempo real mostrando técnicos con foto, estado y ubicación
- Órdenes urgentes con timeline visual y pulso de alerta
- Rutas sugeridas conectando técnico → orden con ETA
- Panel de asignación rápida con matching inteligente
- Inspirado en tableros de despacho de servicios de emergencia
- Metáfora de "control tower" para coordinación de servicios

**Ubicación:**
- Panel Admin: Componente hero del dashboard
- Panel Técnico: Vista simplificada "mi ruta del día"
- Panel Cliente: Vista "mi técnico en camino"

### Defaults Rechazados

1. **Grid de 4 métricas estándar** → Panel de control tipo dispatch board con jerarquía clara
2. **Tabla de órdenes genérica** → Timeline visual con urgencias destacadas y pulso
3. **Lista de técnicos plana** → Mapa interactivo con estado en tiempo real
4. **Stats con iconos decorativos** → Indicadores funcionales con significado en el dominio
5. **Colores semánticos genéricos** → Paleta derivada del mundo físico de talleres

---

## Direction

### Concepto Visual: "Taller Profesional Moderno"

Un sistema que evoca la profesionalidad de un taller técnico bien organizado:
- Superficies limpias como mesas de trabajo
- Herramientas naranjas como acento
- Etiquetas y documentación clara
- Estructura metálica sutil
- Ambiente ordenado y eficiente

**No es:**
- Corporativo frío
- Demasiado técnico/complejo
- Decorativo sin función
- Genérico de SaaS

**Es:**
- Profesional pero accesible
- Técnico pero humano
- Ordenado pero dinámico
- Confiable y eficiente

---

## Design System

### Depth Strategy

**Borders + Subtle Shadows**

Combinación de bordes sutiles para estructura y sombras ligeras para elevación:
- Bordes rgba con opacidad progresiva (no hex sólidos)
- Sombras muy sutiles solo en elevación
- Sin drop shadows dramáticos
- Elevación mediante lightness shift + border + shadow mínima

### Spacing Base Unit

**4px** (0.25rem)

Escala: 4, 8, 12, 16, 24, 32, 48, 64

### Color Palette

```css
/* Base - Ambiente de Taller */
--workshop-floor: 210 20% 98%;
--steel-frame: 215 16% 47%;
--tool-orange: 25 95% 53%;
--safety-vest: 48 96% 53%;

/* Texto - Etiquetas y Documentos */
--label-ink: 222 47% 11%;
--label-faded: 215 20% 65%;
--stamp-red: 0 84% 60%;
--checkmark-green: 142 76% 36%;

/* Estados de Servicio */
--pending-amber: 38 92% 50%;
--assigned-blue: 217 91% 60%;
--in-progress-purple: 262 52% 47%;
--completed-green: 142 71% 45%;

/* Superficies - Elevación */
--surface-base: 210 20% 98%;
--surface-raised: 0 0% 100%;
--surface-card: 0 0% 100%;
--surface-overlay: 210 20% 99%;

/* Bordes - Separación */
--border-light: 214 32% 91%;
--border-standard: 214 32% 85%;
--border-emphasis: 215 25% 70%;
--border-focus: 25 95% 53%;
```

### Typography

**Primary:** Inter (técnico, legible, profesional)
**Mono:** JetBrains Mono (números, códigos, datos)

**Escala:**
- Hero: 2.5rem (40px) - Números grandes
- H1: 2rem (32px) - Títulos principales
- H2: 1.5rem (24px) - Subtítulos
- H3: 1.25rem (20px) - Títulos de card
- Body: 1rem (16px) - Texto normal
- Small: 0.875rem (14px) - Metadatos
- Tiny: 0.75rem (12px) - Labels

**Pesos:**
- 800: Números hero
- 700: Encabezados
- 600: Énfasis
- 400: Normal
- 300: Metadatos

### Border Radius

- Small: 0.375rem (6px) - Inputs, buttons
- Medium: 0.5rem (8px) - Cards
- Large: 0.75rem (12px) - Modals
- XL: 1rem (16px) - Hero cards

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

### Animation

**Duraciones:**
- Instant: 100ms
- Fast: 200ms
- Normal: 300ms
- Slow: 500ms

**Easing:**
- Ease Out: cubic-bezier(0.33, 1, 0.68, 1)
- Ease In-Out: cubic-bezier(0.65, 0, 0.35, 1)

**No usar:** Spring, bounce (demasiado casual para contexto profesional)

---

## Component Patterns

### TechnicianCard (Admin Panel)

**Uso:** Mostrar técnico con estado, zona y próxima asignación

**Estructura:**
- Foto circular (48px) con borde de estado (3px)
- Nombre en label-ink, peso 600
- Estado con badge y punto pulsante
- Zona en label-faded, tamaño small
- Especialidades como chips pequeños
- Mini-timeline si tiene próxima orden

**Estados:**
- Disponible: Borde verde pulsante
- Ocupado: Borde azul sólido
- Descanso: Borde naranja sólido

### UrgentOrderBanner (Admin Panel)

**Uso:** Destacar órdenes urgentes que requieren atención inmediata

**Estructura:**
- Fondo stamp-red con opacidad 10%
- Borde izquierdo grueso (4px) stamp-red
- Icono de alerta con animación pulse
- Tiempo transcurrido en rojo
- Botón de asignación prominente
- Animación de pulso sutil en todo el banner

### ServiceTimeline (Client Panel)

**Uso:** Mostrar progreso del servicio de forma visual

**Estructura:**
- Timeline vertical con 5 pasos
- Paso actual: punto grande con glow
- Pasos completados: checkmark verde
- Pasos futuros: punto gris outline
- ETA del técnico si está en camino
- Foto del técnico en paso "asignado"

### NextJobCard (Technician Panel)

**Uso:** Card hero mostrando próximo trabajo del técnico

**Estructura:**
- Card grande (hero del dashboard)
- Mapa pequeño con ruta (200px height)
- ETA prominente en naranja
- Cliente y dirección
- Problema en badge de urgencia
- Botones de acción grandes (navegar, llamar, iniciar)
- Gradiente sutil de fondo

---

## Consistency Checks

- ✅ Spacing en grid de 4px
- ✅ Depth usando borders + subtle shadows
- ✅ Colores de paleta Workshop
- ✅ Tipografía Inter + JetBrains Mono
- ✅ Border radius según escala definida
- ✅ Animaciones con easing profesional
- ✅ Tokens intencionales (no genéricos)

---

**Creado:** 2026-02-08
**Última actualización:** 2026-02-08
**Versión:** 1.0
