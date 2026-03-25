# CLAUDE_UI.md — Frontend & UI Instructions for Claude Code

> This file supplements the main CLAUDE.md with frontend-specific context.
> Claude Code should read this before any UI/component/page task.

## Tech Stack (Frontend)

- **Framework:** Next.js 16, React 19, TypeScript (strict mode)
- **Styling:** CSS Modules (`*.module.css`) + design tokens (`styles/tokens.css`)
- **Fonts:** Single custom font via `--font-primary` CSS variable (set in layout)
- **Icons:** Custom SVG components in `components/ui/icons.tsx`, all use `currentColor`
- **No utility frameworks:** No Tailwind, no styled-components — only CSS Modules + tokens

## Project Structure

```
components/
  ui/                     ← Atoms: Button, Input, icons, Typography, Badge, etc.
    Button.tsx
    Button.module.css
    Input.tsx
    Input.module.css
    icons.tsx              ← All SVG icon components
  sections/               ← Page sections (hero, text blocks, grids, etc.)
  layout/                 ← Header, Footer, navigation

styles/
  tokens.css              ← Design tokens (auto-generated from Figma, DO NOT edit)
  globals.css             ← Global resets, font import, :root token inclusion

app/
  layout.tsx              ← Root layout, fonts, metadata
  [slug]/page.tsx         ← Dynamic pages from DB
```

## Design Tokens Reference

All visual values come from `styles/tokens.css`. Never hardcode colors, sizes, or spacing.

### Color System (Dark Theme)

| Purpose | Token | Resolved Value |
|---------|-------|----------------|
| Page background | `--surface-body-bg` | `#18181a` |
| Card / elevated bg | `--surface-level-3` (card-bg) | `#2c2a33` |
| Input bg (default) | `--surface-level-2` | `#242329` |
| Input bg (focused) | `--surface-level-1` | `#1e1d21` |
| Deepest surface | `--dark-neutral-0` | `#000000` |

| Purpose | Token | Resolved Value |
|---------|-------|----------------|
| Primary text | `--text-primary` / `--vis-default` | `#f0f0f7` |
| Secondary text | `--text-secondary` / `--vis-fuzzy` | `#cdccdf` |
| Muted / label text | `--text-darker` / `--vis-dim` | `#a5a3b6` |
| Fading / hint text | `--vis-fading` | `#838293` |
| Inactive / borders | `--vis-inactive` | `#5b5a69` |
| Maximum white | `--vis-max` / `--light-gray-1000` | `#ffffff` |

| Purpose | Token | Resolved Value |
|---------|-------|----------------|
| Brand accent (main) | `--brand-500` | `#9400d9` |
| Brand bright | `--brand-1000` | `#ef5eff` |
| Brand light | `--brand-300` | `#d280f8` |
| Brand translucent (hover bg) | `--brand-gray-500-tr` | `#9400d926` |
| Error | `--alerts-error` | `#cc0000` |
| Error bg | `--alerts-error-bg` | `#cc00001a` |

### Spacing

| Token | Value | Use For |
|-------|-------|---------|
| `--xxxs` | 2px | Micro gaps |
| `--xxs` | 4px | Tight internal |
| `--xs` | 8px | Icon gaps, button internal gap |
| `--s` | 12px | Compact padding |
| `--md` | 16px | Default padding, input horizontal |
| `--lg` | 20px | Generous padding |
| `--xl` | 24px | Section internal |
| `--semantic-2xl` | 28px | Large gaps |
| `--semantic-3xl` | 32px | Button horizontal padding |
| `--semantic-4xl` | 48px | Section margins |
| `--semantic-5xl` | 52px | Large section |
| `--semantic-6xl` | 64px | Extra-large section |

### Radii

| Token | Value |
|-------|-------|
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 16px |
| `--radius-xl` | 20px |

### Component Sizes

| Token | Value | Used By |
|-------|-------|---------|
| `--button-default` | 52px | Button height, icon-only width, Input height |

### Typography (Shorthand Tokens)

Use these for `font:` shorthand property:

| Token | Weight | Size | Line-height |
|-------|--------|------|-------------|
| `--typo-h2` | 500 | 3rem (48px) | 3.75rem (60px) |
| `--typo-p` | 300 | 1.5rem (24px) | 2.25rem (36px) |
| `--typo-Card-h1` | 200 | 2rem (32px) | 2.75rem (44px) |
| `--typo-Card-h2` | 300 | 1.5rem (24px) | 2rem (32px) |
| `--typo-Card-p` | 300 | 1rem (16px) | 1.75rem (28px) |
| `--typo-Card-number` | 300 | 6rem (96px) | 5.75rem (92px) |
| `--typo-Header-item` | 300 | 1.5rem (24px) | 3rem (48px) |
| `--typo-ui-Button-primary` | 500 | 1rem (16px) | 1.375rem (22px) |
| `--typo-ui-input-text` | 300 | 1.25rem (20px) | 1.375rem (22px) |
| `--typo-ui-input-label` | 600 | 1rem (16px) | 1.375rem (22px) |

### Column Grid

12-column grid at 1360px max width. Column widths:
`--columns-x1` (84px) through `--columns-x12` (1360px). Gap between columns: 32px.

### Shadows

| Token | Value |
|-------|-------|
| `--effect-card-shadow` | `0px 8px 16px 0px #00000040` |
| `--effect-button-shadow` | `0px 4px 12px 0px #00000099` |

---

## Existing Components API

### Button (`components/ui/Button.tsx`)

```tsx
import { Button } from '@/components/ui/Button'

// Standard button variants
<Button variant="primary">Label</Button>
<Button variant="secondary">Label</Button>
<Button variant="create" icon={<IconPlus />}>Create New</Button>

// Icon-only (square, no label)
<Button variant="primary" icon={<IconBurger />} />

// Action buttons (icon-only, colored by semantic action)
<Button action="delete" />   // Red tones
<Button action="add" />      // Blue tones
<Button action="edit" />     // Purple tones
<Button action="hide" />     // Dark red
<Button action="online" />   // Green
<Button action="preview" />  // Orange

// As link (renders <a> via Next.js Link)
<Button variant="primary" href="/about">About</Button>

// Disabled
<Button variant="primary" disabled>Disabled</Button>
```

**Variants behavior:**
- `primary` — dark bg (`--surface-level-3`), border `#4f4e57`, white text, box-shadow. Hover: translucent brand bg, brand border, bright pink text.
- `primary` icon-only — transparent bg, no border, no shadow. Hover: dark bg appears.
- `secondary` — transparent bg, dim border, primary text. Hover: translucent brand bg, white border+text.
- `create` — level-4 bg, fading border, shadow. Has left padding for icon. Hover: darker bg, dim border.
- `action` — transparent, semantic color at 75% opacity. Hover: full opacity + level-2 bg circle.

**Sizing:** All buttons are 52px tall (`--button-default`). Icon-only buttons are 52×52.

### Input (`components/ui/Input.tsx`)

```tsx
import { Input } from '@/components/ui/Input'

// Basic
<Input label="Email" />

// With hint
<Input label="Password" hint="At least 8 characters" type="password" />

// With error
<Input label="Email" error="Invalid email address" />

// Controlled
<Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />

// Disabled
<Input label="Locked" disabled />
```

**Behavior:**
- Floating label: hidden by default, appears (fades in) when focused or has value.
- Placeholder equals the label text.
- States: default (level-3 bg, inactive border), focused (level-1 bg, primary text border), error (error bg, red border), disabled (50% opacity).
- Height: 52px (`--button-default`), matching buttons.

### Icons (`components/ui/icons.tsx`)

All icons use `currentColor` for fill — color is controlled via CSS on the parent.

Available: `IconPlus`, `IconBurger`, `IconCaretLeft`, `IconCV`, `IconClose`, `IconDelete`, `IconAdd`, `IconEdit`, `IconHide`, `IconOnline`, `IconCaretDown`, `IconCaretUp`, `IconPreview`.

```tsx
import { IconPlus, IconClose } from '@/components/ui/icons'
// Use in JSX — color inherits from parent's CSS `color` property
<span style={{ color: 'var(--text-primary)' }}><IconPlus /></span>
```

---

## UI Task Workflows

### Creating a New Page

1. Create route file: `app/[route]/page.tsx` — server component
2. Fetch data (sections, content) on the server side
3. Render sections via shared `<SectionRenderer>` or directly compose section components
4. No hardcoded content in page files — everything from DB or CMS
5. Add metadata via Next.js `generateMetadata` export

### Creating a New Component

1. Create two files in the same directory: `ComponentName.tsx` + `ComponentName.module.css`
2. Component file: typed props with TypeScript interface, `'use client'` only if using hooks/interactivity
3. CSS file: all values from tokens (`var(--…)`), no hardcoded hex/px
4. Export the component as a named export
5. Follow the same patterns as Button/Input (see API above)

### Creating a New Section

1. Identify the closest existing section type or create a new one in `components/sections/`
2. Section components receive content as props (typed interface)
3. Use existing atoms (Button, Input, Typography) — don't recreate
4. Responsive: mobile-first base styles → `@media (min-width: 768px)` → `@media (min-width: 1024px)`
5. Max content width: use `--columns-x12` (1360px) for full-width, narrower column tokens for constrained layouts

### Editing Existing Component

1. **Read the component's .tsx and .module.css first** — understand current implementation
2. Make minimal changes — don't rewrite working code
3. Preserve existing class names to avoid breaking other usages
4. If adding a new variant, follow the existing variant pattern (see Button variants)
5. Test that existing usages still work

---

## Section Type Map

| User Wants | Section Type | Atoms/Components | Key Tokens |
|-----------|-------------|------------------|------------|
| Hero / full-width intro | `hero` | Typography, Button | `--typo-h2`, `--semantic-6xl` padding |
| Heading + body text | `text` | Typography | `--typo-p`, `--columns-x8` max-width |
| Image with caption | `image` | — | `--radius-lg`, `--effect-card-shadow` |
| Metric / number highlight | `stat_card` | Typography | `--typo-Card-number`, `--card-bg` |
| Multi-column cards | `grid` | Card component | `--columns-x*` for widths |
| Form / contact | `form` | Input, Button | — |
| Navigation bar | `nav` | Button, icons | `--header-background`, `--typo-Header-item` |
| Visual separator | `divider` | — | `--vis-inactive` for line color |

---

## CSS Component Checklist

Before finishing any component, verify:

- [ ] File pair: `Name.tsx` + `Name.module.css` in the same directory
- [ ] All colors via tokens: `var(--text-primary)`, `var(--surface-level-3)`, etc.
- [ ] All spacing via tokens: `var(--md)`, `var(--xs)`, `var(--semantic-3xl)`, etc.
- [ ] All radii via tokens: `var(--radius-md)`, etc.
- [ ] All typography via tokens: `font: var(--typo-Card-h1)`, or individual `font-size: var(--fs-lg)` + `font-weight` + `line-height`
- [ ] No inline styles, no hardcoded hex/rgb/px values
- [ ] No `!important`
- [ ] Transitions: use `0.2s ease` as default (matches existing components)
- [ ] Semantic HTML: `<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`, `<main>` — not `<div>` for everything
- [ ] Hover states: provide visual feedback (bg change, border change, color change)
- [ ] Disabled state: `opacity: 0.4; cursor: not-allowed; pointer-events: none;` (matches Button)
- [ ] Mobile-first responsive if the component appears in layouts

## CSS Patterns Used in This Project

### Class Name Composition (no libraries)
```tsx
const cn = (...parts: (string | false | undefined)[]) =>
  parts.filter(Boolean).join(' ')

// Usage:
className={cn(styles.wrapper, error && styles.hasError, focused && styles.isFocused)}
```

### State Classes on Wrapper
```css
/* Base state */
.wrapper { /* defaults */ }

/* State modifiers — applied to wrapper, affect children */
.isFocused .input { background: var(--surface-level-1); }
.hasError .input { border-color: var(--alerts-error); }
.isDisabled { opacity: 0.5; pointer-events: none; }
```

### Variant Classes (Button pattern)
```css
.button { /* shared base: height, border-radius, font, transitions */ }
.primary { /* variant-specific: bg, border, color, shadow */ }
.primary:hover { /* variant-specific hover */ }
.secondary { /* different variant */ }
```

### Icon Sizing
Icons in buttons use a fixed wrapper: `width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;`

### Transitions
Standard transition: `transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;`
Only transition properties that actually change.

---

## Common Pitfalls

1. **Don't import Tailwind classes.** This project uses CSS Modules + tokens. No `className="flex items-center"`.

2. **Don't use `styled-components` or CSS-in-JS.** All styles go in `.module.css` files.

3. **Don't edit `tokens.css`.** It's auto-generated from Figma. If a token is missing, add it to the Figma source and regenerate, or define a local CSS variable in the component's `.module.css`.

4. **Don't create new color values.** Use existing tokens. If you need a semi-transparent version, use `rgba()` with the token's hex value (see how `--brand-gray-500-tr` is defined: `#9400d926`).

5. **Don't use `rem` for component dimensions.** Use tokens for spacing/sizing. The 52px button height is a fixed pixel value (`--button-default: 52px`), not rem.

6. **Icons must use `currentColor`.** Never hardcode fill colors in SVG icon components. Color is always inherited from CSS.

7. **`'use client'` only when needed.** Server components by default. Only add `'use client'` for components that use `useState`, `useEffect`, event handlers, or browser APIs.

8. **Button as link.** Don't wrap `<Button>` in `<a>`. Use `<Button href="/path">` — it renders a Next.js `<Link>` internally.

9. **Input always needs a `label`.** It serves as both placeholder and floating label. Don't add a separate `<label>` element outside the component.

10. **No `<form>` tags in React artifacts.** Use `onClick` / `onChange` handlers directly.

---

## Adding a New Icon

1. Open `components/ui/icons.tsx`
2. Add a new exported function component following the existing pattern:
```tsx
export function IconNewName() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="..." fill="currentColor"/>
    </svg>
  )
}
```
3. Use `fill="currentColor"` on all paths — never hardcode colors
4. Keep consistent `width`/`height` with existing icons (most are 24–32px)
5. Import where needed: `import { IconNewName } from '@/components/ui/icons'`

## Adding a New Button Variant

1. Add the variant name to the `ButtonVariant` type in `Button.tsx`
2. Add CSS class in `Button.module.css` following existing pattern:
```css
.newVariant {
  background: var(--token);
  border-color: var(--token);
  color: var(--token);
}
.newVariant:hover {
  background: var(--token);
  /* ... */
}
```
3. The variant class is applied automatically via `styles[variant]` in the component

## Adding a New Action Button Type

1. Add the action name to the `ButtonAction` type in `Button.tsx`
2. Add the icon mapping in `ACTION_ICONS` record
3. Add CSS classes in `Button.module.css`:
```css
.action_newAction { color: var(--action-default-newAction); }
.action_newAction:hover { color: var(--action-hover-newAction); background-color: var(--surface-level-2); }
```
4. Define the color tokens in `tokens.css` (or request Figma update)
