# Stage 1: Build dependencies
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY miniProject/package*.json ./miniProject/

# Install dependencies
RUN npm ci --production
RUN cd miniProject && npm ci --production

# Stage 2: Production image
FROM node:18-alpine

# Install required runtime dependencies
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy built dependencies from builder
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/miniProject/node_modules ./miniProject/node_modules

# Copy application files
COPY --chown=appuser:appgroup . .

# Create directories for runtime data
RUN mkdir -p /app/miniProject/logs && \
    chown -R appuser:appgroup /app/miniProject/logs

# Set environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS=--dns-result-order=ipv4first

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "app.js"]