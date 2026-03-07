# Grudge Warlords MMO - Production Dockerfile
# Multi-stage build for optimized server deployment

FROM node:18-alpine AS base

# Install dependencies needed for builds
RUN apk add --no-cache \
    bash \
    git \
    openssh-client

WORKDIR /app

# Copy package files (if they exist)
COPY package*.json ./

# Install Node.js dependencies
RUN if [ -f package.json ]; then npm ci --production; fi

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache bash

# Copy from base stage
COPY --from=base /app/node_modules ./node_modules

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p logs builds

# Set environment to production
ENV NODE_ENV=production

# Expose ports for game server
EXPOSE 3000 7777

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server/index.js"]
