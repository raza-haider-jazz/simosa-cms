# =============================================================================
# SIMOSA CMS Backend - Production Dockerfile for OpenShift
# Fixed: Build output path, Prisma 7 config, production start command
# =============================================================================
 
# Build stage
FROM node:20-alpine AS builder
 
WORKDIR /app
 
# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
 
# Install ALL dependencies (including devDependencies for build)
RUN npm ci
 
# Copy source code and config
COPY . .
 
# Generate Prisma Client
RUN npx prisma generate
 
# Build the application
RUN npm run build
 
# Verify build output
RUN ls -la dist/ && ls -la dist/src/ || true
 
# =============================================================================
# Production stage
# =============================================================================
FROM node:20-alpine
 
WORKDIR /app
 
# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init
 
# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs
 
# Copy package files
COPY package*.json ./
 
# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force
 
# Copy Prisma files and regenerate client for production
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
RUN npx prisma generate
 
# Copy built application (NestJS outputs to dist/src/ with current config)
COPY --from=builder /app/dist ./dist
 
# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R nestjs:nodejs uploads
 
# Set ownership of app files
RUN chown -R nestjs:nodejs /app
 
# Switch to non-root user
USER nestjs
 
# Expose port
EXPOSE 4000
 
# Environment defaults
ENV NODE_ENV=production
ENV PORT=4000
 
# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1
 
# Start the application with dumb-init for proper signal handling
# Note: Build outputs to dist/src/main.js due to NestJS/TypeScript config
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]