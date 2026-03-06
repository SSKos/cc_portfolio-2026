# Portfolio CMS — Memory

## Stack
- Next.js 16 + React 19 + TypeScript 5.9 (strict)
- Prisma 7 + PostgreSQL (pg adapter required — no `url` in schema.prisma)
- NextAuth.js v5 beta (credentials, JWT, single admin)
- CSS Modules + CSS custom properties (tokens.css) — NO Tailwind
- Zod for validation
- bcryptjs for password hashing

## Design system (Figma)
- File: https://www.figma.com/design/tQSh2iLj0pzwGepcBtlMSf/Portfolio-Library
- Dark theme, font: "Nunito Sans" (weights: 300 Light, 400 Regular, 500 Medium)
- Surfaces: --surface-1 #1e1d21 (bg), --surface-2 #242329 (card), --surface-3 #2c2a33 (elevated)
- Text: --text-primary #f0f0f7, --text-secondary #cdccdf, --text-darker #a5a3b6, --text-accent #9b46c2
- Accent purple: #9b46c2 (fuzzy), #7a0aad (max/border)
- Border: --visibility-fading #838293
- Header: 88px height, 1360px max-width, frosted glass (rgba(36,35,41,0.9) + blur(16px))
- Button radius: 12px, height 52px, padding 28px
- Card shadow: 0 8px 16px 0 rgba(0,0,0,0.25)

## Key files
- `lib/formatText.ts` — typography formatter, run before ALL text saves to DB
- `lib/prisma.ts` — Prisma singleton with $extends for formatText on Page fields
- `lib/auth.ts` — NextAuth config, signIn/signOut/auth exports
- `middleware.ts` — protects /admin/* routes
- `styles/tokens.css` — ALL design tokens, never hardcode values
- `prisma/schema.prisma` — Page, Section, Media, User models + SectionType enum
- `prisma.config.ts` — DB URL lives here (not in schema.prisma — Prisma 7 requirement)
- `scripts/seed-admin.ts` — creates initial admin user

## Prisma 7 gotchas
- `url` in datasource removed from schema.prisma — must be in prisma.config.ts
- `$use` middleware removed — use `$extends` with query hooks instead
- Need `@prisma/adapter-pg` + `pg` packages for direct PostgreSQL connection
- Run `prisma generate` before build (added to npm build script)

## Component structure (Atomic Design)
- `components/ui/` — atoms: Button, Input, Badge, Tag, Typography
- `components/blocks/` — molecules: TextBlock, ImageBlock, StatCard
- `components/sections/` — organisms: Hero, Grid, List, Divider
- `components/layout/` — Header, Footer, PageWrapper

## Section types
`text | image | stat_card | hero | grid | divider | figma_block`

## API structure
- All admin API: `/app/api/admin/`
- Auth: `/app/api/auth/[...nextauth]/route.ts`
- All admin routes must check session at top of handler

## v1 → v2 migration
- typography.ts from v1 → lib/formatText.ts (ported, added widow prevention)
- prepare-figma-archive.sh from v1 → copy as-is (Phase 5)
- v1 was Python FastAPI + Vue.js, v2 is Next.js full-stack

## Phases status
- Phase 1 (Skeleton): ✅ Done
- Phase 2 (Design System): 🔲
- Phase 3 (Backend API): 🔲
- Phase 4 (Public renderer): 🔲
- Phase 5 (Figma pipeline + Admin UI): 🔲

## Dev commands
- `npm run dev` — dev server
- `npm run db:migrate` — run migrations
- `npm run db:studio` — Prisma Studio
- `docker compose up` — postgres + app
