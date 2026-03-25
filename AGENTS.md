# Portfolio CMS — Codex Instructions

## Project Overview
A self-hosted portfolio website with a custom CMS admin panel.
The owner (designer/developer) manages all content through the admin panel.
Visitors see the public-facing portfolio.

---

## Tech Stack
- **Framework**: Next.js 16.~ (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: CSS Modules + CSS custom properties (tokens)
  - CSS files live on disk, accessible via SSH/SFTP
  - **NO Tailwind. NO CSS-in-JS. No exceptions.**
- **Auth**: NextAuth.js (single admin user)
- **File storage**: Local filesystem (`/public/uploads/`)
- **Deployment**: VPS via Docker + Nginx
- **Language**: TypeScript throughout, strict mode

---

## Architecture

### Atomic Design Structure
```
components/
  ui/        # atoms:     Button, Input, Badge, Tag, Typography
  blocks/    # molecules: TextBlock, ImageBlock, StatCard
  sections/  # organisms: Hero, Grid, List, Divider
  layout/    # Header, Footer, PageWrapper
```

### Data Model
- **Page** — a route (`/`, `/projects`, `/about`). Has slug, metadata, header/footer variant.
- **Section** — ordered content block within a Page. Has `type` + `content` (JSON).
- **Action** — optional, attachable to any block: `{ type: "link"|"modal", value: "..." }`

### Section Types
`text` | `image` | `stat_card` | `hero` | `grid` | `divider` | `figma_block`

---

## Critical Rules

### 1. Text Formatting (NON-NEGOTIABLE)
Every text field saved to the database MUST go through `lib/formatText.ts` first.
Never write raw unformatted text to DB.

`lib/formatText.ts` enforces:
- Typographic quotes (curly), em/en dashes
- Widow prevention (non-breaking space before last word)
- Hanging punctuation normalization
- Clean whitespace (collapse, trim)

Call it in Prisma middleware OR in the API route handler — before `prisma.section.create/update`.

### 2. Figma Import Pipeline
Flow: Figma Make export → `prepare-figma-archive.sh` → `lib/figmaTransform.ts` → `POST /api/admin/import` → saved as Section (type: `figma_block`)

Do not break this pipeline. When modifying Section model or API, verify import still works.

### 3. CSS Tokens
All visual values (colors, spacing, typography, radius) come from `styles/tokens.css`.
Never hardcode values like `color: #333` or `padding: 16px` in component CSS.
Always use: `color: var(--color-text-primary)`, `padding: var(--space-4)`.

---

## Security Requirements
Apply these to every API route and data operation:

- [ ] Session validated via `getServerSession()` before any data access
- [ ] User input validated with Zod schema
- [ ] File uploads: validate MIME from buffer, max 10MB, sanitize filename, save as `/public/uploads/[uuid].[ext]`
- [ ] No raw SQL with string interpolation — Prisma parameterized queries only
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] All secrets in environment variables, never hardcoded

---

## Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Project skeleton: Next.js + Prisma + NextAuth + Docker + CSS tokens | 🔲 |
| 2 | Design System: ui/ → blocks/ → sections/ | 🔲 |
| 3 | Admin panel: page tree + section editor + media manager | 🔲 |
| 4 | Public page renderer | 🔲 |
| 5 | Figma import pipeline + text formatter | 🔲 |

**Update the status column as phases complete.**

---

## Conventions

### File naming
- Components: `PascalCase.tsx` + `PascalCase.module.css`
- Utilities: `camelCase.ts`
- API routes: Next.js convention (`route.ts`)

### API routes
All admin routes live under `/app/api/admin/`.
All require session check at the top of the handler.

### Commits
One feature per commit. Format: `feat: add StatCard block` / `fix: formatText widow edge case`

---

## Knowledge Base Instruction

After completing any meaningful feature, phase, or architectural decision, ask:
> "Should I create a CC_ doc for this?"

If the user says **"да" (yes)** — create a `.md` file with the prefix `CC_` written in **Russian**.
The document should explain:
- What was built and why
- Key decisions made
- Gotchas and things to watch out for
- How it connects to the rest of the system

Example: `CC_Фаза1_Скелет.md`, `CC_Дизайн_Система.md`, `CC_Figma_Импорт.md`

These docs form the owner's personal knowledge base about this project.

---

## Do Not Touch Without Explicit Instruction
- `styles/tokens.css` — design token changes affect the entire system
- `prisma/schema.prisma` — always discuss migration plan before changing
- `lib/formatText.ts` — changing this affects all text already in the DB
- `/public/uploads/` — never delete files programmatically
