# Multi-stage Dockerfile for Booking Service
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage with minimal base image
FROM eclipse-temurin:17-jre-jammy

# Create non-root user
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -s /bin/sh appuser

WORKDIR /app

# Copy the built jar from build stage
COPY --from=build --chown=appuser:appgroup /app/target/*.jar app.jar

# Switch to non-root user
USER appuser

EXPOSE 8084

ENTRYPOINT ["java", "-jar", "app.jar"]
