FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ── Install all dependencies (including dev for prisma CLI) ───────────────────
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Production runner ─────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/node_modules      ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next             ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public            ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma            ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts  ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json      ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts    ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json     ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/sandbox-content   ./sandbox-content
COPY --from=builder --chown=nextjs:nodejs /app/components        ./components
COPY --from=builder --chown=nextjs:nodejs /app/styles            ./styles

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
