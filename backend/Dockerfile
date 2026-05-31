###############################################################################
# NetLayer Cloud — backend production image
###############################################################################
# Multi-stage build:
#   1. deps      → install all node_modules with --frozen-lockfile-equivalent
#   2. builder   → compile TypeScript + generate Prisma client
#   3. runtime   → minimal alpine image with only production runtime
#
# Image size target: < 250 MB compressed
#
# Run with:
#   docker build -t netlayer/backend:latest -f backend/Dockerfile backend
#   docker run -p 5000:5000 --env-file .env.prod netlayer/backend:latest
###############################################################################

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Production runs Postgres — switch the active schema to the Postgres variant
# before generating the client + compiling. (The repo default schema.prisma is
# SQLite for local dev; the Postgres variant lives in schema.postgres.prisma.)
RUN cp prisma/schema.postgres.prisma prisma/schema.prisma
# Prisma client must be generated at build-time so the compiled output
# references the right binary target for alpine.
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat dumb-init && \
    addgroup -S netlayer && adduser -S netlayer -G netlayer
ENV NODE_ENV=production
ENV PORT=5000

# Copy only what we need at runtime: dist + Prisma engines + node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER netlayer
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O- http://localhost:5000/healthz || exit 1

# dumb-init so SIGTERM cleanly stops Node + flushes BullMQ
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
