# ============================================================
# Stage 1: Build
# Install ALL deps (including devDependencies) so we can run
# the TypeScript compiler and Next.js build.
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for layer caching
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDeps: typescript, ts-node, etc.)
RUN npm ci

# Copy source
COPY . .

# 1. Compile server.ts → dist/server.js
RUN npx tsc --project tsconfig.server.json --outDir dist --noEmit false

# 2. Build Next.js production bundle
RUN npm run build

# ============================================================
# Stage 2: Production
# Only copy what's needed to run; no dev tools, no source.
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy manifests and install PRODUCTION deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled server
COPY --from=builder /app/dist ./dist

# Copy Next.js build output and static files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy Next.js config (needed at runtime)
COPY --from=builder /app/next.config.ts ./next.config.ts

# Render injects PORT at runtime; default to 3000 for local runs
ENV PORT=3000

EXPOSE 3000

# Run the compiled JS server directly — no ts-node needed
CMD ["node", "dist/server.js"]
