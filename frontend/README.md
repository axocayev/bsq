# BSQ Frontend

React + Vite web application for the BSQ Exam Portal. Multi-language UI with role-based access (Admin, School Admin, Teacher, Student).

## Quick Start

### Install & Run

```bash
cd frontend
npm install
npm run dev      # dev server on http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

### Docker

```bash
docker compose build --no-cache frontend  # rebuild
docker compose up -d frontend             # start (port 80)
```

## Architecture

**Root components**: `src/`

### Key Directories

- **`pages/`** — Page components (Admin, Teacher, Student dashboards, exams, questions, etc.)
  - `admin/` — Admin pages (schools, users, exams, subjects)
  - `school-admin/` — School admin pages (users, exams, results, OTP distribution)
  - `teacher/` — Teacher pages (dashboard, questions, exams, exam manage, results)
  - `student/` — Student pages (dashboard, exams, take exam, results)
  - `auth/` — Login page
  - `LandingPage.jsx` — Public landing page

- **`components/`** — Reusable components
  - `AppLayout.jsx` — Main layout with header, sidebar, content (shows school name for certain roles)
  - `ProtectedRoute.jsx` — Role-based access control

- **`api/`** — Axios API wrappers
  - `axiosInstance.js` — Configured axios with interceptors
  - `auth.js` — Authentication endpoints
  - `exams.js` — Exam CRUD and operations
  - `questions.js` — Question CRUD
  - `subjects.js` — Subject endpoints
  - `users.js` — User management
  - `files.js` — File upload (instant, no compression)

- **`context/`** — React Context
  - `AuthContext.jsx` — Auth state, login/logout, user data

- **`routes/`** — Route components
  - `ProtectedRoute.jsx` — Role-based route wrapper

- **`utils/`** — Utilities
  - `questionTypes.js` — Question type constants and display helpers

- **`i18n/`** — Internationalization
  - `en.json`, `az.json`, `ru.json` — Language translations
  - Configuration in `App.jsx` via i18next

- **`styles/`** — Global styles (if any)

## Key Technologies

- **React 18** with hooks (useState, useEffect, useContext)
- **Vite** — fast bundler and dev server
- **Ant Design** — UI component library
- **Axios** — HTTP client
- **React Router v6** — client-side routing
- **i18next** — internationalization (English, Azerbaijani, Russian)
- **dayjs** — date/time utilities
- **Recharts** — charts (for dashboards)

## Features

### Authentication & Authorization

- **Login**: Username/password → JWT token stored in localStorage
- **Protected Routes**: `ProtectedRoute` component checks role and redirects unauthorized users
- **Auto-redirect**: Different home pages per role (Admin → /admin/dashboard, Teacher → /teacher/dashboard, etc.)
- **School Context**: Users belong to schools; school name displayed in header for SCHOOL_ADMIN, TEACHER, STUDENT

### Teacher Exam Management

- **Create Exam**: Set title, description, duration, start date
- **Manage Page** (new): Full-page interface for exam setup
  - **Add Questions**: Search question bank, select multiple, add to exam
  - **Edit Marks**: Adjust points per question (total must = 100)
  - **Assign Students**: Search and select students (similar to question modal)
  - **Back Button**: Return to exams list
- **Question Bank**: Reusable questions with types (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, OPEN)
- **Auto-save Answers**: Students' answers save in real-time during exams

### File Upload

- **Instant Upload**: No client-side compression (was slow, now instant)
- **Max 1MB**: File size validation
- **Visible Loading**: Alert component shows "Uploading..." with progress bar
- **Progress Tracking**: Real-time upload percentage display
- **Image Preview**: Shows uploaded image in edit form

### Multi-Language

- **3 Languages**: English, Azerbaijani, Russian
- **Language Switcher**: In AppLayout (top-right)
- **i18next**: Translation keys organized by feature (exams, questions, users, etc.)
- **RTL Support**: Ready for right-to-left languages (Azerbaijani)

### Role-Based UI

| Role | Features |
|------|----------|
| **Admin** | Schools, users, exam approval, subjects |
| **School Admin** | Users in school, exam assignment/approval, OTP distribution, results |
| **Teacher** | Dashboard, questions, exams, results |
| **Student** | Exams list, take exam with OTP, results |

## API Integration

### Key Endpoints Used

**Auth**
- `POST /auth/login` → AuthResponse (user, token, schoolName)

**Exams**
- `GET /teacher/exams` — List exams
- `GET /teacher/exams/:id` — Get exam details
- `POST /teacher/exams` — Create exam
- `PUT /teacher/exams/:id` — Update exam
- `DELETE /teacher/exams/:id}` — Delete exam
- `POST /teacher/exams/:id/questions` — Add questions
- `GET /teacher/exams/:id/questions` — Get exam questions
- `PUT /teacher/exams/:id/questions/:qId/points` — Update question marks
- `POST /teacher/exams/:id/assign` — Assign students
- `GET /teacher/exams/:id/assignments` — Get assignments (for results)

**Questions**
- `GET /teacher/questions` — List questions
- `POST /teacher/questions` — Create question
- `PUT /teacher/questions/:id` — Update question
- `DELETE /teacher/questions/:id` — Delete question

**Files**
- `POST /files/upload` — Upload file (max 1MB)

## Recent Changes (June 2026)

- **Questions Page Refactoring** (June 3):
  - Moved question creation/editing from modal to dedicated full pages
  - New `CreateQuestionPage.jsx` component at `/teacher/questions/create` (create mode)
  - Edit mode at `/teacher/questions/:id/edit` (reuses same component with pre-filled data)
  - Back button navigation to return to questions list
  - Improved options layout using Card-based design for better UX
  - Added "Import Questions from File" button (placeholder - shows "Coming Soon")
  - View-only modal remains for reading question details
  - I18n keys updated: `questions.importFromFile`, `questions.option` for all 3 languages

- **Home Page & Logout** (`App.jsx` Home component): `/` route unified with login/dashboard
  - Not logged in: Shows LoginPage at `/`
  - Logged in: Redirects to role dashboard (`/admin/dashboard`, `/teacher/dashboard`, etc.)
  - Logout: `AppLayout.jsx` line 99 does `navigate('/', { replace: true })` → home page
  - Removed separate `/landing` page

- **ExamManagePage** (`pages/teacher/ExamManagePage.jsx`): Full-page exam management
  - Replaced drawer-based UI with dedicated page at `/teacher/exams/:examId/manage`
  - Back button to return to exams list
  - Consistent with teacher workflow

- **Student Assignment Modal**: Works like question bank
  - Search students by name
  - Multi-select with checkboxes
  - Prevents duplicate assignments
  - Shows list of already-assigned students

- **File Upload**: Removed canvas-based compression
  - Was blocking UI during compression
  - Now instant upload with visible Alert loading indicator
  - File size limited to 1MB (backend enforces)

- **School Name Header**: Added to AppLayout
  - Fetched from `AuthResponse.schoolName` on login
  - Displays for SCHOOL_ADMIN, TEACHER, STUDENT roles
  - Used for user context and school-specific UI
  - `exams.allAlreadyAssigned`, `exams.noStudentsAssigned`
  - Supported in English, Azerbaijani, Russian

## State Management

**Context API** (via `AuthContext`):
- Current user
- Auth token
- Login/logout functions
- School context

**Local Component State** (useState):
- Form data, modals, table selections, loading states
- Passed down via props or Context

## Styling

**Ant Design**: Primary color is `#1677ff` (blue)
- Override in `App.jsx` via `ConfigProvider theme`
- Uses Ant Design's built-in spacing, colors, responsive grid

## Build & Deployment

### Development

```bash
npm run dev
```

Vite hot-reload enabled. API calls go to `http://localhost:8080` (configured in `axiosInstance.js`).

### Production

```bash
npm run build    # output: dist/
npm run preview  # preview dist/
```

Docker build: `docker compose build frontend`

**Docker Setup**:
- Multi-stage: Node build → Nginx serve
- Nginx serves dist/ on port 80
- Env variable substitution for backend API URL (if needed)

## Troubleshooting

### "API calls return 401 Unauthorized"

- Check token is stored: `localStorage.getItem('authToken')`
- Verify server is running: `docker compose up -d backend`
- Check network tab for request headers

### "Components not rendering; import error"

- Check file paths in imports (case-sensitive on Linux)
- Verify file exists in the path specified

### "Translations missing"

- Check i18n file (`src/i18n/en.json`, etc.)
- Verify key path matches usage: `t('exams.title')`
- Run `npm run build` to catch missing keys

### "Upload stuck at 100%"

- Check backend `/files/upload` endpoint is working
- Verify file size < 1MB
- Check MinIO S3 storage is running: `docker compose up -d minio`

## Contributing

- Create feature branch from main
- Use Ant Design components for consistency
- Add translation keys to all 3 language files (en, az, ru)
- Test on multiple screen sizes (mobile, tablet, desktop)
- Deploy via Docker: `docker compose build frontend && docker compose up -d frontend`
