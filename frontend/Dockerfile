# =============================================================================

# SIMOSA CMS Frontend - Production Dockerfile for OpenShift

# Fixed: Permissions for UBI image & Lockfile mismatch ignored

# =============================================================================
 
# --- STAGE 1: BUILDER ---

FROM node:20-alpine AS builder
 
WORKDIR /app
 
# Build argument for API URL

ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
 
# Copy package files

COPY package*.json ./
 
# FIX 1: Use 'npm install' (not 'npm ci') to ignore lockfile mismatch

RUN npm install
 
# Copy source code

COPY . .
 
# Build the Next.js application

RUN npm run build
 
# --- STAGE 2: PRODUCTION ---

FROM registry.access.redhat.com/ubi9/nodejs-20-minimal
 
# FIX 2: Switch to root to fix permissions

USER root
 
WORKDIR /app
 
# FIX 3: Grant ownership of /app to the OpenShift user (1001)

# This prevents "EACCES: permission denied" during npm install

RUN chown -R 1001:0 /app
 
# FIX 4: Switch back to the secure user

USER 1001
 
# Copy package files

COPY package*.json ./
 
# Install only production dependencies

# FIX 5: Use 'npm install' here too for consistency

RUN npm install --only=production && npm cache clean --force
 
# Copy built application

COPY --from=builder /app/.next ./.next

COPY --from=builder /app/public ./public

COPY --from=builder /app/next.config.ts ./
 
# Expose port

EXPOSE 3000
 
# Environment defaults

ENV NODE_ENV=production

ENV PORT=3000
 
# Health check

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \

  CMD curl -f http://localhost:3000/ || exit 1
 
# Start the application

CMD ["npm", "run", "start"]
 