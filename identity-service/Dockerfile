# Multi-stage Dockerfile for identity-service
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies (cached layer)
COPY package*.json ./
RUN npm install --omit=dev

# Runtime stage
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy dependencies and application code
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

EXPOSE 8081

CMD ["node", "index.js"]
