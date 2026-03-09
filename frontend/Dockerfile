# Multi-stage Dockerfile for Frontend (Next.js)
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# GATEWAY_URL must be set at build time — Next.js bakes rewrites into the
# routes manifest during `next build`, so runtime env vars have no effect.
# The default here matches the Docker service name used in docker-compose.
ARG GATEWAY_URL=http://gateway:8080
ENV GATEWAY_URL=${GATEWAY_URL}
RUN npm run build

# Runtime stage — standalone output is self-contained (no node_modules needed)
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone build output
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# public/ may be empty but must exist for Next.js standalone server
COPY --from=build /app/public/ ./public/

EXPOSE 3000

CMD ["node", "server.js"]
