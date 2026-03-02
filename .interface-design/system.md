# Work OS — Interface Design System

## Direction & Feel
**Precision-functional** — A project management workspace for teams. Physical analogue: an open-plan operations room with status boards and project timelines. Clean and efficient, not playful. Dense enough to show real data, spacious enough to breathe.

**Who uses it:** Team leads, project managers, individual contributors — people juggling multiple deadlines, checking status quickly between meetings.

**What they do:** Scan project status, update tasks, create boards, track progress across portfolios.

**How it should feel:** Confident, legible, fast. Like a tool that respects the user's time. Not cold — the green accent adds life — but serious.

---

## Typography
- **Body:** `DM Sans` (geometric humanist, clean distinctive letterforms — NOT Arial/Roboto)
- **Display / Labels / Headings:** `Sora` (unique geometric stroke terminals, tight tracking -0.02em)
- **Data / Numbers:** `tabular-nums` font feature + monospace where alignment matters
- **Letter spacing body:** `-0.01em` on body, `-0.02em` on headings, `+0.06em` on uppercase labels

## Color Tokens (from index.css @theme)
```
--color-primary:          #00c875   ← brand green, used for primary actions + active states
--color-primary-hover:    #00b065
--color-primary-light:    #e6f9f0
--color-surface:          #ffffff
--color-surface-secondary:#f4f6f9   ← inset backgrounds, table headers, empty states
--color-surface-hover:    #eef2f6
--color-border:           #e2e8f0
--color-border-light:     #f1f5f9
--color-text-primary:     #081829   ← headings, important data
--color-text-secondary:   #64748b   ← supporting text, descriptions
--color-text-disabled:    #a8b5c7   ← placeholders, muted labels, table headers
```

## Depth Strategy
**Borders + subtle single shadow.** NOT layered dramatic shadows. Cards use:
```css
border: 1px solid rgba(0,0,0,0.06);
box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03);
```
Dropdowns / overlays add one more layer:
```css
box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.05);
```

## Border Approach
- rgba borders, NEVER solid hex
- Standard: `rgba(0,0,0,0.06)`
- Subtle: `rgba(0,0,0,0.04)`
- Separator: height 1px div, same rgba approach
- Focus rings: `box-shadow: 0 0 0 3px rgba(0,200,117,0.2)`

## Spacing Base
**4px** — multiples of 4 throughout. Micro gaps: 4–8px. Component: 12–16px. Section: 20–24px. Page: 24–32px.

## Border Radius Scale
- Inputs / small buttons: `6px–8px`
- Cards / panels: `12px`
- Modals: `16px`
- Tags / badges: `6px`

---

## Text Hierarchy (4 levels — always use all 4)
1. **Primary** — `var(--color-text-primary)` #081829 — headings, values, names
2. **Secondary** — `var(--color-text-secondary)` #64748b — descriptions, supporting text
3. **Tertiary** — dates, counts, metadata — same secondary color at smaller size
4. **Muted** — `var(--color-text-disabled)` #a8b5c7 — placeholders, table column headers, disabled

---

## Sidebar
- Background: `#0c1420` (Precision Dark)
- Text: `rgba(200,214,232,0.7)` inactive → `#ffffff` active
- Active item: `rgba(0,200,117,0.12)` background + 3px left accent pip with green glow
- Hover: `rgba(255,255,255,0.05)` background
- Borders: `rgba(255,255,255,0.06)` — identical rgba approach as light mode

## TopBar
- `h-12`, white background
- Subtle separator: `border-b border-border-light`

---

## Component Patterns

### Stat Cards (used 4x in Dashboard)
- Radial SVG ring (56×56, R=22, stroke 3.5px) showing percentage fill
- Big number (Sora, 28px, tracking -0.04em) + label + sublabel
- Border + subtle shadow treatment (no colored icon box)

### Status Badges
- Soft background: `rgba(color, 0.1)` NOT solid fill
- Border: `rgba(color, 0.3)` 1px
- Text: the color itself (not white on colored bg)
- Radius: 6px

### Table Rows
- Left accent line: 3px wide, colored by status, NOT full solid bg
- No hover row highlight with strong color — use `var(--color-surface-secondary)`
- Borders: `rgba(0,0,0,0.05)` between rows
- Dates use `tabular-nums`, delayed dates get red + semibold emphasis

### Progress Bars
- Track: `rgba(0,0,0,0.08)` — NOT `bg-gray-200`
- Fill: conditional green/amber/green based on pct
- Height: 3px (thin, precise) — NOT 8px (chunky)

### Context Menu Dropdowns
- `border: 1px solid rgba(0,0,0,0.08)`
- Layered shadow
- Hover: system surface-secondary
- Destructive item: `--color-status-red` text, `--color-status-red-light` hover bg
- Separator: 1px rgba div, not `<hr>`

### Buttons Primary
- Background: `var(--color-primary)`
- Shadow: `0 1px 3px rgba(0,200,117,0.35)`
- Hover: `var(--color-primary-hover)`
- Radius: 8px
- Font: 13px, 500 weight

---

## Signature Elements
1. **Radial ring stat cards** — percentage fill ring instead of icon-in-colored-box
2. **Left status pip on table rows** — 3px accent bar colored by status, with glow on sidebar active items
3. **Sora headings** — visual character in section labels and h1/h2 elements
4. **Quiet borders** — rgba approach everywhere, nothing solid-hex

## Anti-patterns to avoid
- `bg-gray-200`, `text-gray-500`, `border-gray-100` — always use token vars
- Solid status badge fills (full green/red backgrounds)
- `font-bold text-3xl` with `<p className="text-sm text-gray-500">` — 2-level hierarchy is too flat
- Shadow-heavy cards
- Mixed depth strategies (some cards with shadows, some without)
