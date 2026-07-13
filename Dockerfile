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

# Set default env variables for building
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_PROVIDER=sqlite
ENV DATABASE_URL="file:./databases/production.db"
ENV GOOGLE_CLIENT_ID="production_google_client_id"
ENV GOOGLE_CLIENT_SECRET="production_google_client_secret"
ENV AUTH_SECRET="super-secret-random-hash-key-for-console-jwt-signing-2026"
ENV OPS_ADMIN_USERNAME="admin"
ENV OPS_ADMIN_PASSWORD="AdminPassword123!"
ENV OPS_JWT_SECRET="super-secret-random-hash-key-for-console-jwt-signing-2026"

# Configure Prisma provider and run schema compilation
RUN node scripts/configure-db.js
RUN npm run build

# Stage 3: Runner
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
