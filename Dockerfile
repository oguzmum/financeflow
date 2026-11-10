# syntax=docker/dockerfile:1
# One app image (ADR-0006): Spring Boot serves the API and the React build.
#
# Build the jar first (needs Docker for jOOQ codegen and Testcontainers):
#   ./mvnw -B verify
# then: docker compose build   (or: docker build -t financeflow .)
#
# Why not build inside Docker: jOOQ generates its classes from a throwaway PostgreSQL started by Testcontainers,
# which can't run inside `docker build`.

ARG JRE_IMAGE=eclipse-temurin:25.0.5_8-jre-alpine

# --- Stage 1: split the Spring Boot jar into layers (dependencies change rarely -> better layer caching)
FROM ${JRE_IMAGE} AS extract
WORKDIR /build
COPY target/financeflow-*.jar app.jar
RUN java -Djarmode=tools -jar app.jar extract --layers --launcher --destination extracted

# --- Stage 2: runtime
FROM ${JRE_IMAGE}
RUN addgroup -S financeflow && adduser -S financeflow -G financeflow
WORKDIR /app
COPY --from=extract /build/extracted/dependencies/ ./
COPY --from=extract /build/extracted/spring-boot-loader/ ./
COPY --from=extract /build/extracted/snapshot-dependencies/ ./
COPY --from=extract /build/extracted/application/ ./
USER financeflow

# Small footprint on shared hardware (C-8, ADR-0006: app + backup sidecar <= 300 MB). Overridable via env.
# Heap is a share of the container memory limit set in compose.yaml.
ENV JAVA_TOOL_OPTIONS="-XX:+UseSerialGC -XX:MaxRAMPercentage=45 -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=48m -Xss512k -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health/liveness >/dev/null || exit 1
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
