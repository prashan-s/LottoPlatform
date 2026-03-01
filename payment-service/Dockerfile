# Multi-stage Dockerfile for payment-service
FROM golang:1.24-alpine AS build

# Install CGO dependencies for confluent-kafka-go (librdkafka)
RUN apk add --no-cache gcc musl-dev librdkafka-dev pkgconf

WORKDIR /app

# Copy go mod files and download dependencies (cached layer)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and build
COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -tags dynamic -o payment-service .

# Runtime stage with minimal base image
FROM alpine:latest

# Install librdkafka runtime library
RUN apk add --no-cache librdkafka

# Create non-root user
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy the built binary from build stage
COPY --from=build --chown=appuser:appgroup /app/payment-service .
COPY --from=build --chown=appuser:appgroup /app/migrations ./migrations

# Switch to non-root user
USER appuser

EXPOSE 8082

CMD ["./payment-service"]
