# =============================================================================

# SIMOSA CMS Frontend - Production Dockerfile for OpenShift

# Fixed: Ownership order to allow lockfile updates

# =============================================================================
 
# --- STAGE 1: BUILDER ---

FROM node:20-alpine AS builder
 
WORKDIR /app
 
# Build argument for API URL

ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
 
COPY package*.json ./

# FIX 1: Use 'npm install' to ignore lockfile mismatch

RUN npm install
 
COPY . .

RUN npm run build
 
# --- STAGE 2: PRODUCTION ---

FROM registry.access.redhat.com/ubi9/nodejs-20-minimal
 
# 1. Switch to Root

USER root

WORKDIR /app
 
# 2. Copy files FIRST (They arrive owned by Root)

COPY package*.json ./
 
# 3. FIX: Grant ownership of the FOLDER AND THE FILES to User 1001

# This ensures package-lock.json is writable

RUN chown -R 1001:0 /app
 
# 4. Switch to the secure user

USER 1001
 
# 5. Install (Now it has permission to update the lockfile)

RUN npm install --only=production && npm cache clean --force
 
# Copy built application

# (Builder artifacts don't need to be writable, so this is fine)

COPY --from=builder /app/.next ./.next

COPY --from=builder /app/public ./public

COPY --from=builder /app/next.config.ts ./
 
EXPOSE 3000

ENV NODE_ENV=production

ENV PORT=3000
 
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \

  CMD curl -f http://localhost:3000/ || exit 1
 
CMD ["npm", "run", "start"]
 