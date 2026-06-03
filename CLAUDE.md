# CLAUDE.md

This file provides guidance to Claude Code when working with the BSQ Exam Portal repository.

## Quick Start

### Backend

Requires Java 17 (default system Java works):

```bash
cd backend
./gradlew build        # build and run tests
./gradlew compileJava  # compile only
./gradlew test         # run tests
./gradlew bootRun      # start server on http://localhost:8080
./gradlew bootJar      # produce executable jar
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # dev server on http://localhost:5173
npm run build          # production build
npm run test           # run unit & integration tests
npm run test:ui        # run tests with UI
npm run test:coverage  # run tests with coverage report
```

### Docker (All Services)

```bash
docker compose up -d           # start all services
docker compose build frontend  # rebuild frontend
docker compose build backend   # rebuild backend
```

Services: `frontend` (port 80), `backend` (port 8080), `postgres`, `minio`

## Architecture

### Backend

**Package**: `az.bsq`

**Tech Stack**:
- Java 17, Spring Boot 3.4.1
- Spring Security + JWT authentication
- Spring Data JPA + Hibernate ORM
- PostgreSQL database
- Flyway for schema migrations
- Lombok for boilerplate
- MapStruct for DTO mapping
- MinIO for S3-compatible file storage
- SpringDoc OpenAPI for API docs

**Layering**:
- `controller` — REST endpoints
- `service` / `service/impl` — business logic
- `dao` — Spring Data JPA repositories
- `mapper` — MapStruct entity↔DTO mapping
- `model` — JPA entities and DTOs
- `exception` — custom exceptions and handlers
- `config` — Spring configuration

**Key Features**:
- Multi-role system (ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT)
- School-based isolation
- Exam lifecycle (DRAFT → PENDING_APPROVAL → APPROVED → PUBLISHED → CLOSED)
- Real-time answer auto-saving
- File uploads via MinIO
- JWT-based authentication

### Frontend

**Tech Stack**:
- React 18 with hooks
- Vite bundler
- Ant Design components
- React Router v6
- i18next (English, Azerbaijani, Russian)
- Axios HTTP client
- dayjs for dates

**Structure**:
- `pages/` — Role-specific pages (admin, teacher, student, school-admin)
- `components/` — Reusable UI components
- `api/` — Axios API wrappers
- `context/` — React Context (auth state)
- `i18n/` — Translation files
- `utils/` — Helper utilities

**Key Features**:
- Role-based access control
- Multi-language UI
- Teacher exam management (questions, marks, student assignment)
- File upload with progress tracking
- Real-time answer saving
- OTP-based student access
- School name display in header

## Database

**PostgreSQL** with **Flyway** migrations in `backend/src/main/resources/db/migration/`

Key tables:
- `users` — system users
- `schools` — school entities
- `school_users` — user-school mappings
- `questions` — question bank
- `exams` — exam definitions
- `exam_questions` — exam composition (questions + marks)
- `assignments` — student exam assignments
- `answers` — student answers (auto-saved)

## File Storage

**MinIO** (S3-compatible) for uploads:
- Question images
- Exam question images
- Student answer attachments
- Max file size: 1MB (enforced on frontend + backend)

## Authentication

JWT-based:
1. POST `/auth/login` (username/password) → returns JWT token + user + schoolName
2. Token stored in `localStorage`
3. All requests include `Authorization: Bearer <token>` header
4. Backend validates JWT in security filter

## API Endpoints

See `backend/README.md` for complete endpoint list. Common endpoints:

**Auth**:
- `POST /auth/login`
- `POST /auth/register` (if enabled)

**Teacher**:
- `GET /teacher/exams` — list exams
- `POST /teacher/exams` — create exam
- `GET /teacher/exams/:id` — get exam details
- `POST /teacher/exams/:id/questions` — add questions
- `PUT /teacher/exams/:id/questions/:qId/points` — set question marks
- `POST /teacher/exams/:id/assign` — assign students
- `GET /teacher/questions` — list questions
- `POST /teacher/questions` — create question
- `POST /teacher/questions/import-ai` — import questions from file via AI parsing (PDF/DOCX/TXT)

**Student**:
- `GET /student/exams` — list assigned exams
- `POST /student/exams/:id/start` — start with OTP
- `PUT /student/exams/:id/answer` — save answer
- `POST /student/exams/:id/submit` — submit exam

**Files**:
- `POST /files/upload` — upload file (1MB max)

## Development Patterns

### Backend

- Use Lombok `@Data`, `@Slf4j` for boilerplate
- MapStruct for all entity↔DTO mapping
- Service interfaces with implementation classes
- Custom exceptions extending `RuntimeException`
- Spring Security for authorization

### Frontend

- React hooks (useState, useEffect, useContext)
- Ant Design for all UI components
- i18next for all user-facing strings (never hardcode)
- Axios with `axiosInstance` for API calls
- Context API for global auth state

## Recent Changes (June 2026)

- **AI Question Import** (June 3):
  - Complete flow: File upload → Claude parsing → Edit & approve → Save to database
  - Upload phase: Drag-drop file input (PDF, DOCX, TXT), 10MB limit
  - AI parsing: Backend extracts text and calls Claude Haiku 4.5 API
  - Review phase: Editable question cards with inline editing (no modal)
  - Per-question approval: Each question saved independently via createQuestion API
  - Backend: New `AiQuestionImportService`, POST `/v1/teacher/questions/import-ai`
  - Frontend: New `ImportQuestionsAIPage` with 3-phase state machine (upload → review → done)
  - Dependencies: Apache PDFBox 3.0.3 (PDF), Apache POI 5.3.0 (DOCX)
  - Configuration: Set `ANTHROPIC_API_KEY` environment variable
  - i18n: Complete translations for 29 new keys in English, Azerbaijani, Russian
  - Routes: `/teacher/questions/import-ai` navigated from Questions page "Import Questions" button

- **Questions Page Refactoring** (June 3):
  - Moved question creation/editing from modal to dedicated full pages
  - New `CreateQuestionPage.jsx` at `/teacher/questions/create` (create mode)
  - Edit mode at `/teacher/questions/:id/edit` (reuses same component)
  - Back button navigation to return to questions list
  - Improved options layout using Card-based design (better than nested form items)
  - "Import Questions" button now navigates to AI import page (no longer "Coming Soon")
  - View-only modal remains for reading question details
  - Translation keys updated for all 3 languages (en, az, ru)
  - Routes: `/teacher/questions/create`, `/teacher/questions/:id/edit`, `/teacher/questions/import-ai`

- **ExamService Refactoring** (June 1):
  - Created `OtpService` to isolate OTP generation (side effect)
  - Reduced `assignStudents()` complexity from 7 → 2 (71% improvement)
  - Extracted 7 status validation methods (eliminates duplication)
  - Refactored `update()` and `adminUpdate()` to share validation
  - Improved code quality score: 7.5/10 → 8.7/10
  - See `IMPLEMENTATION_SUMMARY.md` and `CODE_REVIEW_ExamService.md`

- **Logout & Home Page** (Updated June 1): 
  - Logout redirects to `/` (home page) via `navigate('/', { replace: true })`
  - `/` route shows `Home` component: LoginPage if not logged in, dashboard redirect if logged in
  - Removed separate `/landing` page
  - `replace: true` prevents back button returning to protected page

- **Exam Manage Page**: Full-page UI at `/teacher/exams/:examId/manage` (was drawer)
  - Add questions with search from bank
  - Edit question marks (total must = 100)
  - Assign students with search modal
  - Back button to return to exams list

- **File Upload**: Instant upload (removed canvas compression)
  - Visible Alert loading indicator
  - Progress bar with percentage
  - 1MB file size limit

- **Student Assignment**: Modal with search (like question bank)
  - Search students by name
  - Multi-select with checkboxes
  - Prevents duplicate assignments

- **School Name Header**: Displays in header for SCHOOL_ADMIN, TEACHER, STUDENT
  - Fetched from login response
  - Shows user's school context

## Troubleshooting

### Backend won't start
- Check Java version: `java -version` (needs 17+)
- Check PostgreSQL is running: `docker compose up -d postgres`
- Check port 8080 is free

### Frontend won't build
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node version: `node -v` (needs 18+)

### Database migration fails
- Check Flyway migrations in `backend/src/main/resources/db/migration/`
- Verify PostgreSQL is running and accessible
- Drop and recreate database if needed: `docker compose down postgres && docker compose up -d postgres`

### File upload fails
- Check MinIO is running: `docker compose up -d minio`
- Check file size < 1MB
- Check network tab in browser DevTools

## Testing

### Backend Tests (Spring Boot + JUnit + Mockito)

**Run tests:**
```bash
cd backend
./gradlew test              # run all tests
./gradlew test --tests AdminControllerTest  # run specific test class
```

**Test Structure:**
- `controller/` — Controller layer tests with MockMvc
- `integration/` — Full integration tests with H2 database
- Uses `@SpringBootTest` for context loading
- Uses `@ActiveProfiles("test")` for test database configuration
- H2 in-memory database for fast test execution

**Coverage:**
- AdminController: CRUD operations, authorization checks
- AdminDashboard: Data aggregation, role-based filtering
- Integration: End-to-end API flows

### Frontend Tests (Vitest + React Testing Library)

**Setup:**
```bash
cd frontend
npm install  # installs testing dependencies (vitest, @testing-library/react, jsdom)
```

**Run tests:**
```bash
npm run test              # run all tests
npm run test:ui          # interactive UI mode
npm run test:coverage    # coverage report
npm run test -- AdminDashboard  # run specific test
```

**Test Structure:**
- `__tests__/` — Test files colocated with components
- Mock API calls with `vi.mock()`
- Mock routing with `useNavigate`
- Use `waitFor()` for async operations
- Test user interactions with `userEvent`

**Coverage:**
- AdminDashboard: Data fetching, stat cards, pie charts
- SchoolAdminDashboard: Recent exams/users, clickable rows, navigation
- API integration: Correct endpoint calls with proper parameters

### Test After Every Change

**Workflow:**

1. **Backend Change:**
   ```bash
   cd backend && ./gradlew test
   ```

2. **Frontend Change:**
   ```bash
   cd frontend && npm run test
   ```

3. **Full Integration Test (after Docker build):**
   ```bash
   docker compose up -d
   docker compose exec backend ./gradlew test
   docker compose exec frontend npm run test
   ```

4. **Verify in Browser:**
   - Open http://localhost
   - Test the feature manually
   - Check browser console for errors
   - Verify data loads and interactions work

### CI/CD Integration

Pre-commit checks should run:
```bash
# Backend
./gradlew build           # compiles + tests
./gradlew test           # unit + integration tests
./gradlew bootJar        # verify jar builds

# Frontend
npm run lint             # code quality
npm run test             # unit + integration tests
npm run build            # verify production build
```

### Common Test Issues

**Backend:**
- Test needs `@Transactional` to avoid flushing issues
- Use `@ActiveProfiles("test")` for separate test config
- Mock external services (MinIO, email) in unit tests
- Integration tests use H2 database

**Frontend:**
- Mock all API calls with `vi.mock()`
- Mock routing and navigation
- Use `waitFor()` for async state updates
- Mock i18n translations to avoid hard dependency

## Architecture & Code Quality Skills

A comprehensive **Software Architecture Skill** template is available at `.claude/skills/software-architecture.md` containing:

**Architecture Sections:**
- **Analysis framework** for evaluating designs
- **BSQ-specific patterns** (layering, DTOs, mappers, authorization)
- **Decision-making checklist** (scalability, reliability, security, maintainability)
- **Code review guidelines** (structure, performance, security, testing)
- **Documentation templates** for architecture decisions
- **Performance & security considerations**
- **Refactoring guidance**

**Clean Code & Best Practices Sections:**
- **Meaningful naming** conventions (variables, functions, classes, constants)
- **Small functions** with single responsibility (max 20-30 lines)
- **Pure functions** & side effect minimization
- **Cyclomatic complexity** reduction (early returns, strategy patterns)
- **Separation of business logic** from framework code
- **Continuous refactoring** (Boy Scout Rule, code smells)
- **Programming paradigms** (Structured, OOP, Functional)

Use this when designing new features, reviewing code, or making architecture decisions.

## CI/CD Pipeline

**Complete Pipeline Setup Guide:** See `PIPELINE_SETUP.md`

**Quick Overview:**
- **GitLab CI** (recommended) or GitHub Actions
- **Stages:** Code Quality → Build & Test → Docker → Deploy (dev/test/prod)
- **Feature branch:** Runs quality checks + tests
- **Merge to main:** Deploys to test
- **Tag `prod-*`:** Deploys to production (manual)

**Setup:**
1. Choose platform (GitLab or GitHub)
2. Copy pipeline template from `PIPELINE_SETUP.md`
3. Set environment variables (registry, deploy token, SonarQube)
4. Add Dockerfiles for backend and frontend
5. Push and monitor pipeline runs

---

## Contributing

1. Create feature branch from main
2. Make changes, write tests
3. Run: `cd backend && ./gradlew test` and `cd frontend && npm run test`
4. Update CLAUDE.md if architecture changes
5. Reference `.claude/skills/software-architecture.md` for design patterns
6. Test locally: `docker compose up -d` and verify in browser
7. Submit PR with tests passing and description of changes
8. After merge to main, pipeline auto-deploys to test
9. For production: Create tag `prod-*` and manually trigger deployment
