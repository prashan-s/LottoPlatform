# Multi-stage Dockerfile for Gateway
FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle.kts settings.gradle.kts ./

# Make wrapper executable and download dependencies (cached layer)
RUN chmod +x ./gradlew && ./gradlew dependencies --no-daemon || true

# Copy source code and build
COPY src ./src
RUN ./gradlew clean build -x test --no-daemon

# Runtime stage with minimal base image
FROM eclipse-temurin:21-jre-jammy

# Create non-root user
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -s /bin/sh appuser

WORKDIR /app

# Copy the built jar from build stage
COPY --from=build --chown=appuser:appgroup /app/build/libs/*.jar app.jar

# Switch to non-root user
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
