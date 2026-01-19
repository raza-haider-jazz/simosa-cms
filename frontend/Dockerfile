# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Production stage
# FROM node:20-alpine
FROM registry.access.redhat.com/ubi9/nodejs-20

WORKDIR /app



# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/components.json ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
