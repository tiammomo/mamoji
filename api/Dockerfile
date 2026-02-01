# Build stage
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml pom.xml
RUN mvn -f pom.xml dependency:go-offline -B

# Copy source and build
COPY . .
RUN mvn -f pom.xml package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S mamoji && adduser -S mamoji -G mamoji

# Copy the built jar file
COPY --from=builder /app/target/*.jar app.jar

# Create directories for logs and config
RUN mkdir -p /app/logs /app/config && chown -R mamoji:mamoji /app

# Switch to non-root user
USER mamoji

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/auth/profile || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
