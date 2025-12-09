# Multi-stage build for Spring Boot + React
FROM maven:3.9-eclipse-temurin-17 AS build

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

# Copy pom.xml first (for better layer caching)
# Dependencies are only re-downloaded if pom.xml changes
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy frontend package.json first for better npm caching
# npm install only runs if package.json changes
COPY frontend/package.json ./frontend/
RUN cd frontend && npm install

# Copy remaining frontend files and build
COPY frontend ./frontend
RUN cd frontend && npm run build

# Copy source code and build Java application
# Skip frontend build since we already built it with npm
COPY src ./src
RUN mvn clean package -DskipTests -DskipFrontendBuild=true

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create uploads directory
RUN mkdir -p /app/uploads

# Copy built JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=docker"]

