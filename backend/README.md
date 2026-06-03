# BSQ Backend

Spring Boot microservice for the BSQ Exam Portal. Handles authentication, exam management, question banks, file uploads, and real-time answer saving.

## Quick Start

### Build & Run

Requires Java 17–21 (system default is 25):

```bash
export JAVA_HOME=/Users/anarxocayev/Library/Java/JavaVirtualMachines/corretto-17.0.9/Contents/Home

cd backend

# Build and run tests
./gradlew build

# Compile only (faster)
./gradlew compileJava

# Run tests only
./gradlew test

# Start server on http://localhost:8080
./gradlew bootRun

# Produce executable jar
./gradlew bootJar
```

### Docker

```bash
docker compose build backend      # rebuild
docker compose up -d backend      # start
```

## Architecture

**Package root**: `az.bsq` (or as configured in the project)

### Standard Layering

- **`controller`** — REST endpoints, request/response DTOs
- **`service` / `service/impl`** — business logic interfaces and implementations
- **`dao`** — Spring Data JPA repositories
- **`mapper`** — MapStruct mappers between entities and DTOs
- **`model`** — JPA entities and DTOs
- **`client`** — Feign clients for calling other microservices
- **`config`** — Spring `@Configuration` classes
- **`exception`** — custom exceptions and `@ControllerAdvice` handlers
- **`property`** — `@ConfigurationProperties` classes
- **`scheduler`** — ShedLock-managed scheduled tasks
- **`validator` / `constraint`** — custom JSR-303 validators

## Key Technologies

- **Java 11** (target compatibility)
- **Spring Boot 2.3.x** with Spring Cloud Hoxton
- **Spring Data JPA** with Hibernate
- **PostgreSQL** (dev/test) / **Oracle DB** (prod) via `oracle.jdbc.OracleDriver`
- **Liquibase** for schema migrations (`src/main/resources/liquibase/changelog-master.yaml`)
- **Lombok** — enable annotation processing in IDE; pair with `annotationProcessor`
- **MapStruct** — for DTO↔entity mapping; requires `annotationProcessor`
- **Feign** — inter-service HTTP calls; URLs from env vars, defaults in `application-feign.yaml`
- **OPA** (Open Policy Agent) — authorization checks via `common-opa` module
- **Swagger** via Springfox 2 (`springfox-swagger2` + `springfox-swagger-ui`)
- **ShedLock** — distributed task locking
- **Kafka** — async event publishing/consuming (optional)
- **MinIO** — S3-compatible object storage for file uploads

## Configuration

### Profiles

Active profiles set via `ACTIVE_PROFILE` env var (default: `integration`). Split across multiple files:

```
application-db.yaml          # database config
application-feign.yaml       # Feign client URLs
application-kafka.yaml       # Kafka config
application-logging.yaml     # logging levels
application-opa.yaml         # OPA policy engine
```

### Environment Variables

- `ACTIVE_PROFILE` — Spring profiles to activate (e.g., `integration`, `prod`)
- `JAVA_HOME` — Path to Java 17+ (required for Gradle 8.11)
- Feign service URLs (see `application-feign.yaml`)

## Key Endpoints

### Authentication

- `POST /auth/login` — Login (username/password) → `AuthResponse` with `schoolName`, `user`, token
- `POST /auth/register` — Register (if enabled)

### Teacher APIs

- `GET /teacher/exams` — List teacher's exams
- `GET /teacher/exams/{id}` — Get exam details
- `POST /teacher/exams` — Create exam
- `PUT /teacher/exams/{id}` — Update exam
- `DELETE /teacher/exams/{id}` — Delete exam (DRAFT only)
- `POST /teacher/exams/{id}/questions` — Add questions to exam
- `GET /teacher/exams/{id}/questions` — List exam questions
- `PUT /teacher/exams/{id}/questions/{qId}/points` — Update question marks
- `POST /teacher/exams/{id}/assign` — Assign students to exam
- `GET /teacher/exams/{id}/assignments` — List assignments (for results)
- `POST /teacher/exams/{id}/submit` — Submit for approval
- `GET /teacher/questions` — List teacher's questions
- `POST /teacher/questions` — Create question
- `PUT /teacher/questions/{id}` — Update question
- `DELETE /teacher/questions/{id}` — Delete question

### Student APIs

- `GET /student/exams` — List assigned exams (with OTP)
- `POST /student/exams/{id}/start` — Start exam with OTP
- `PUT /student/exams/{id}/answer` — Save answer (auto-save)
- `POST /student/exams/{id}/submit` — Submit exam
- `GET /student/exams/{id}/result` — Get exam result

### Admin/School Admin APIs

- `POST /admin/exams/{id}/approve` — Approve exam
- `POST /admin/exams/{id}/reject` — Reject exam
- `GET /school-admin/exams` — List school exams
- `POST /school-admin/exams/{id}/approve` — Approve exam

### File Upload

- `POST /files/upload` — Upload file (exam questions, answers with images)
  - Max 1MB per file
  - Stored in MinIO S3-compatible storage

## Database Schema

Managed by Liquibase migrations in `src/main/resources/liquibase/`.

**Key tables**:
- `users` — system users (teachers, students, admins)
- `schools` — school entities
- `school_users` — user-school associations
- `questions` — question bank
- `exams` — exam definitions
- `exam_questions` — exam composition (question + marks)
- `assignments` — student exam assignments
- `answers` — student answers (auto-saved)

## Recent Changes (May 2026)

- **AuthResponse** — Added `schoolName` field; returned from login for UI header display
- **ExamController** — Added `getExamById()` endpoint for manage page
- **ExamAssignments** — Fixed student assignment tracking; UI uses modal with search

## Dependencies

See `build.gradle` for full list. Key shared modules from `../corporate-banking`:

- `:common` — shared DTOs, utilities
- `:common-auth-filter` — JWT auth filter
- `:common-opa` — OPA integration
- `:common-security` — security config
- `:common-payment` — payment flows (optional)

Add via: `implementation project(":common")`

## Testing

```bash
./gradlew test                    # run all tests
./gradlew test --tests SomeTest   # run specific test
```

Uses JUnit 5, Mockito for mocking, TestContainers for DB tests.

## Troubleshooting

### "Cannot run Gradle: Java version mismatch"

Ensure `JAVA_HOME` is set to Java 17+:

```bash
export JAVA_HOME=/Users/anarxocayev/Library/Java/JavaVirtualMachines/corretto-17.0.9/Contents/Home
./gradlew --version  # verify
```

### "Annotation processor not found"

For Lombok and MapStruct, check IDE settings:
- IntelliJ: Settings → Build, Execution, Deployment → Compiler → Annotation Processors → enable
- Gradle: `annotationProcessor 'org.projectlombok:lombok'` in `build.gradle`

### "OPA policy denied"

Check OPA policies in common-opa module and authorization configuration.

## Contributing

- Create feature branch from main
- Follow existing package structure
- Use Lombok for boilerplate; MapStruct for mapping
- Write tests for new features
- Submit MR with tests passing
