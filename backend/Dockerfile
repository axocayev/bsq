# Stage 1 — build
FROM amazoncorretto:17-alpine AS builder
WORKDIR /app

COPY gradlew .
COPY gradle gradle
RUN chmod +x gradlew

# Cache dependencies before copying source
COPY build.gradle settings.gradle ./
RUN ./gradlew dependencies --no-daemon -q 2>/dev/null || true

COPY src src
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2 — run
FROM amazoncorretto:17-alpine
WORKDIR /app

RUN addgroup -S bsq && adduser -S bsq -G bsq
COPY --from=builder /app/build/libs/*.jar app.jar
RUN chown bsq:bsq app.jar

USER bsq
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
