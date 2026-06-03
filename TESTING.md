# Testing Guide for BSQ Exam Portal

## Overview

This project includes comprehensive unit and integration tests for both backend and frontend, with automated test execution after every code change.

## Backend Testing (Spring Boot + JUnit + Mockito)

### Test Files Created

1. **AdminControllerTest.java** (`src/test/java/az/bsq/controller/`)
   - Tests admin API endpoints (schools, users, exams)
   - Verifies authorization (only ADMIN role can access)
   - Tests GET endpoints with pagination
   - 4 test cases

2. **AdminDashboardIntegrationTest.java** (`src/test/java/az/bsq/integration/`)
   - Full integration tests with H2 database
   - Tests complete admin dashboard data flow
   - Verifies role-based access control
   - 5 test cases

3. **application-test.properties** (`src/test/resources/`)
   - H2 in-memory database configuration
   - Fast test execution without PostgreSQL
   - Test-specific JWT secret
   - MinIO mocking support

### Running Backend Tests

```bash
cd backend

# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests AdminControllerTest

# Run specific test method
./gradlew test --tests AdminControllerTest.testAdminCanAccessSchoolsEndpoint

# Run with coverage
./gradlew test --info
```

### Test Coverage

- ✅ AdminController endpoints
- ✅ Authorization checks
- ✅ Data aggregation
- ✅ Pagination handling
- ✅ Role-based access control

## Frontend Testing (Vitest + React Testing Library)

### Configuration Files

1. **vitest.config.js** (root)
   - Configured for jsdom environment
   - @testing-library/jest-dom enabled
   - Coverage reporting enabled
   - Path aliases for imports

2. **src/test/setup.js**
   - Global test setup
   - Mock window.matchMedia for Ant Design
   - Mock react-i18next for translations
   - DOM cleanup between tests

### Test Files Created

1. **AdminDashboard.test.jsx** (`src/pages/admin/__tests__/`)
   - Tests dashboard title rendering
   - Tests stat cards display (schools, users, exams, subjects, students)
   - Tests exam status pie chart data fetching
   - Tests API error handling
   - Tests student count calculation
   - 5 test cases

2. **SchoolAdminDashboard.test.jsx** (`src/pages/school-admin/__tests__/`)
   - Tests dashboard rendering
   - Tests Recent Exams section display
   - Tests Recent Users section display
   - **Tests clickable rows navigation**:
     - Exam rows → navigate to `/school-admin/exams/{id}/assignments`
     - User rows → navigate to `/school-admin/users`
   - Tests empty state handling
   - 6 test cases

### Running Frontend Tests

```bash
cd frontend

# Install test dependencies (already done)
npm install

# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm run test -- AdminDashboard

# Run in watch mode (auto-rerun on changes)
npm run test -- --watch
```

### Test Coverage

- ✅ Component rendering
- ✅ Data fetching and display
- ✅ User interactions (clicks)
- ✅ Navigation after clicks
- ✅ Error handling
- ✅ Empty state handling
- ✅ API integration
- ✅ Pagination and data aggregation

## Test Workflow

### After Every Code Change

**Backend:**
```bash
cd backend
./gradlew test
```

**Frontend:**
```bash
cd frontend
npm run test
```

**Both:**
```bash
# Backend
./gradlew compileJava
./gradlew test

# Frontend  
npm run test

# Docker verification
docker compose up -d
docker compose logs -f
```

### Before Creating PR

1. Run backend tests: `./gradlew test`
2. Run frontend tests: `npm run test`
3. Run frontend build: `npm run build`
4. Manual testing in browser
5. Check console for errors

### CI/CD Integration (Recommended)

```bash
# In your Git pre-commit hook
set -e

# Backend tests
cd backend && ./gradlew test || exit 1

# Frontend tests
cd frontend && npm run test || exit 1

echo "All tests passed!"
```

## Mocking Strategy

### Backend
- Use `@MockBean` for service mocking
- Use `MockMvc` for HTTP testing
- H2 for in-memory test database
- `@Transactional` for test isolation

### Frontend
- `vi.mock()` for module mocking (API calls, routing)
- `waitFor()` for async operations
- `userEvent` for user interaction testing
- `render()` + `screen` for component testing

## Test Data

### Backend
- Automatic H2 database setup/teardown
- Test data created in `@BeforeEach`
- `@Transactional` ensures cleanup

### Frontend
- Mocked API responses
- No real network calls
- Fast test execution
- Isolated tests

## Coverage Goals

- **Backend**: 80%+ of business logic
- **Frontend**: 70%+ of components
- Focus on: critical paths, user interactions, error cases

## Common Issues & Solutions

### Backend Tests Fail
- Ensure Java 17+: `java -version`
- Check H2 database config in application-test.properties
- Run `./gradlew clean` if cache issues occur

### Frontend Tests Fail
- Clear node_modules: `rm -rf node_modules && npm install --legacy-peer-deps`
- Check vitest config is in root directory
- Verify mocks in setup.js are correct

### Tests Hang
- Check for infinite loops or missing async handling
- Use `waitFor()` with proper conditions
- Set test timeout: `vi.setConfig({ testTimeout: 10000 })`

## Next Steps

1. Run tests after every change
2. Maintain 70%+ coverage
3. Add tests for new features
4. Refactor tests as code evolves
5. Monitor CI/CD test results

---

**Last Updated**: June 1, 2026
