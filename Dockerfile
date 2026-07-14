# Stage 1: Dependency Installation
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Production Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time configuration — these are NOT secrets, just defaults for compilation.
# Real values are injected at runtime via environment variables.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_PROVIDER=sqlite
ENV DATABASE_URL="file:./databases/build.db"

# Build args for compilation only — use empty/dummy values that clearly cannot work.
# These satisfy Next.js build-time env checks but are overridden at runtime.
ARG BUILD_GOOGLE_CLIENT_ID="build-time-placeholder"
ARG BUILD_GOOGLE_CLIENT_SECRET="build-time-placeholder"
ARG BUILD_AUTH_SECRET="build-time-placeholder-not-a-real-secret-minimum-length-required-for-compilation"
ARG BUILD_OPS_ADMIN_USERNAME="build-placeholder"
ARG BUILD_OPS_ADMIN_PASSWORD="build-placeholder"
ARG BUILD_OPS_JWT_SECRET="build-time-placeholder-not-a-real-secret-minimum-length-required-for-compilation"

ENV GOOGLE_CLIENT_ID=${BUILD_GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${BUILD_GOOGLE_CLIENT_SECRET}
ENV AUTH_SECRET=${BUILD_AUTH_SECRET}
ENV OPS_ADMIN_USERNAME=${BUILD_OPS_ADMIN_USERNAME}
ENV OPS_ADMIN_PASSWORD=${BUILD_OPS_ADMIN_PASSWORD}
ENV OPS_JWT_SECRET=${BUILD_OPS_JWT_SECRET}

# Configure Prisma provider and run schema compilation
RUN node scripts/configure-db.js
RUN npm run build

# Stage 3: Runner — clean image with no build-time secrets
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set up runtime folders with permissions
RUN mkdir -p /app/databases /app/artifacts_storage /app/logs /app/uploads /app/exports && \
    chown -R nextjs:nodejs /app

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 3000

# Health check endpoint probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Pre-run DB provider settings check on boot and start server
CMD ["sh", "-c", "node scripts/configure-db.js && npx prisma db push --skip-generate && node server.js"]
