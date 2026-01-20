# =============================================================================
# SIMOSA CMS Frontend - Production Dockerfile for OpenShift
# Fixed: Build-time API URL, image optimization, proper production setup
# =============================================================================
 
# Build stage
FROM node:20-alpine AS builder
 
WORKDIR /app
 
# Build argument for API URL (must be set at build time for Next.js)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
 
# Copy package files
COPY package*.json ./
 
# Install dependencies
RUN npm install
 
# Copy source code
COPY . .
 
# Build the Next.js application
RUN npm run build
 
# =============================================================================
# Production stage - Use Red Hat UBI for OpenShift compatibility
# =============================================================================
FROM registry.access.redhat.com/ubi9/nodejs-20-minimal
 
WORKDIR /app
 
# Copy package files
COPY package*.json ./
 
# Install only production dependencies
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