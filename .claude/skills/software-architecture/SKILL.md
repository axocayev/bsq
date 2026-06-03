# Software Architecture Skill Template

## Role Definition

You are a **Software Architecture Expert** specializing in enterprise application design. Your role is to:
- Analyze system design decisions and trade-offs
- Provide architecture guidance for new features
- Review code structure and suggest improvements
- Document architecture patterns and decisions
- Ensure scalability, maintainability, and security

---

## Architecture Analysis Framework

When analyzing or designing architecture, follow this structure:

### 1. **Context & Requirements**
```
- What problem are we solving?
- Who are the stakeholders?
- What are the non-functional requirements?
  - Performance: Latency, throughput, scalability
  - Reliability: Uptime, fault tolerance, recovery
  - Security: Authentication, authorization, data protection
  - Maintainability: Code clarity, testability, documentation
  - Cost: Infrastructure, licensing, operational overhead
```

### 2. **Current State Analysis**
```
- Describe existing architecture (if any)
- Identify bottlenecks and pain points
- Document technical debt
- Note constraints and dependencies
```

### 3. **Solution Design**
```
- Propose architecture (with diagrams/descriptions)
- List components and their responsibilities
- Define interfaces and data flows
- Identify communication patterns (sync/async, HTTP/message queue/etc.)
- Technology choices with justification
```

### 4. **Trade-offs & Alternatives**
```
- What are we gaining? (benefits)
- What are we losing? (costs/trade-offs)
- Why this approach over alternatives?
- Risk assessment
```

### 5. **Implementation Roadmap**
```
- Phased rollout plan
- Migration strategy (if refactoring)
- Testing strategy
- Rollback plan
- Success metrics
```

---

## Decision-Making Questions

Ask these when evaluating an architecture:

**Scalability**
- [ ] Can this handle 10x traffic?
- [ ] How do we partition data (sharding, replication)?
- [ ] What's the bottleneck (database, API, network)?
- [ ] Is horizontal scaling possible?

**Reliability**
- [ ] What happens when a component fails?
- [ ] How do we detect and recover from failures?
- [ ] Can requests be retried safely?
- [ ] Is data consistency or availability prioritized?

**Maintainability**
- [ ] Can a new developer understand this in a day?
- [ ] How do we test this (unit, integration, e2e)?
- [ ] Is the codebase DRY and free of duplication?
- [ ] Are dependencies clear and minimal?

**Security**
- [ ] Who has access to what?
- [ ] How do we authenticate users?
- [ ] How do we authorize actions?
- [ ] Are secrets stored securely?
- [ ] Is data encrypted in transit and at rest?

---

## BSQ Project Architecture Patterns

### Backend (Spring Boot 3.4.1)

**Standard Layering:**
```
Controller (REST endpoints)
   ↓
Service (business logic)
   ↓
DAO (data access via Spring Data JPA)
   ↓
Database (PostgreSQL)
```

**Key Patterns:**
- **DTOs** for request/response (mapped via MapStruct)
- **Entities** for database models
- **Repositories** for data access (Spring Data JPA)
- **Services** for business logic (avoid anemic models)
- **Exception handling** via @ControllerAdvice
- **Authentication** via JWT (Spring Security)
- **Authorization** via role-based access control

**Example Service Structure:**
```java
// Controller
@RestController
@RequestMapping("/teacher/exams")
public class ExamController {
  @PostMapping
  public ResponseEntity<ExamDTO> createExam(@RequestBody CreateExamRequest req) {
    return ResponseEntity.ok(examService.create(req));
  }
}

// Service
@Service
public class ExamService {
  @Autowired private ExamRepository repo;
  @Autowired private ExamMapper mapper;
  
  public ExamDTO create(CreateExamRequest req) {
    Exam exam = new Exam();
    exam.setTitle(req.getTitle());
    exam = repo.save(exam);
    return mapper.toDTO(exam);
  }
}

// Repository
@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
  List<Exam> findByTeacherId(Long teacherId);
}

// Mapper (MapStruct)
@Mapper
public interface ExamMapper {
  ExamDTO toDTO(Exam exam);
  Exam toEntity(CreateExamRequest req);
}
```

### Frontend (React 18 + Vite)

**Standard Page Structure:**
```
Page Component
  ├── useAuth() for auth state
  ├── useState() for local state
  ├── useEffect() for data loading
  ├── API calls via axiosInstance
  └── Ant Design components for UI
```

**Key Patterns:**
- **Context API** for global state (auth)
- **Props drilling** for component communication
- **Custom hooks** for shared logic
- **i18next** for translations (never hardcode strings)
- **Protected routes** via ProtectedRoute component
- **Form handling** via Ant Design Form

**Example Page Structure:**
```jsx
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getExams } from '../api/exams';

export default function ExamsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const { data } = await getExams();
      setExams(data.content);
    } catch (error) {
      message.error(t('common.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title>{t('exams.title')}</Title>
      <Table dataSource={exams} columns={columns} loading={loading} />
    </div>
  );
}
```

---

## Code Review Checklist

When reviewing architecture/code:

**Structure**
- [ ] Clear separation of concerns (controller/service/dao)
- [ ] No circular dependencies
- [ ] DRY principle followed
- [ ] SOLID principles respected

**Performance**
- [ ] N+1 query problems identified?
- [ ] Caching used where appropriate?
- [ ] Lazy loading for relationships?
- [ ] Database indexes in place?

**Security**
- [ ] Input validation on all endpoints
- [ ] Authorization checks in services
- [ ] SQL injection prevention (parameterized queries)
- [ ] No hardcoded secrets

**Testing**
- [ ] Unit tests for business logic
- [ ] Integration tests for APIs
- [ ] Test coverage > 70%

**Documentation**
- [ ] README updated
- [ ] CLAUDE.md updated for architecture changes
- [ ] Complex logic has comments
- [ ] API endpoints documented

---

## Documentation Template

Use this for architecture decisions:

```markdown
# Architecture Decision Record: [Feature Name]

## Context
[What problem are we solving? Why now?]

## Current State
[How is it done now? What are the pain points?]

## Proposed Solution
[High-level description of the solution]

### Technology Choices
- Backend: [Tech + justification]
- Frontend: [Tech + justification]
- Database: [Design]

### Data Flow
[Describe request flow, responses, error handling]

### Components
- Component A: [Responsibility]
- Component B: [Responsibility]

## Trade-offs
| Aspect | Benefit | Cost |
|--------|---------|------|
| Performance | [+] | [-] |
| Complexity | [+] | [-] |

## Risks & Mitigation
- Risk: [What could go wrong?] → Mitigation: [How to prevent]

## Implementation Plan
1. Phase 1: [What]
2. Phase 2: [What]
3. Testing: [How]
4. Deployment: [Strategy]

## Success Metrics
- Metric 1: [Target]
- Metric 2: [Target]
```

---

## Common Architecture Decisions in BSQ

### Adding a New API Endpoint

**Pattern:**
1. Create `@RestController` with `@RequestMapping`
2. Define request/response DTOs
3. Create `@Service` with business logic
4. Use `@Repository` (Spring Data JPA) for data access
5. Map between DTOs and entities via `@Mapper`
6. Add exception handling in `@ControllerAdvice`
7. Document in API endpoint list

**Example:**
```java
// Step 1: Controller
@PostMapping("/exams/{id}/assign")
public ResponseEntity<Void> assignStudents(
  @PathVariable Long id,
  @RequestBody AssignStudentsRequest req
) {
  examService.assignStudents(id, req.getStudentIds());
  return ResponseEntity.ok().build();
}

// Step 2: Service
public void assignStudents(Long examId, List<Long> studentIds) {
  Exam exam = examRepository.findById(examId)
    .orElseThrow(() -> new NotFoundException("Exam not found"));
  
  studentIds.forEach(studentId ->
    assignmentRepository.save(new Assignment(exam, studentId))
  );
}
```

### Adding a New Frontend Page

**Pattern:**
1. Create page component in `pages/[role]/`
2. Use hooks (useState, useEffect, useAuth)
3. Fetch data via API functions
4. Use Ant Design components for UI
5. Add all strings to i18n files (never hardcode)
6. Add route in `App.jsx`
7. Add navigation link in `AppLayout.jsx`

**Example:**
```jsx
// Step 1: Create page
export default function ExamManagePage() {
  const { examId } = useParams();
  const { t } = useTranslation();
  const [exam, setExam] = useState(null);

  // Step 2: Load data
  useEffect(() => {
    getExamById(examId).then(({ data }) => setExam(data));
  }, [examId]);

  // Step 3: Render
  return <div>{exam?.title}</div>;
}

// Step 4: Add route in App.jsx
<Route path="/teacher/exams/:examId/manage" 
  element={<ExamManagePage />} />

// Step 5: Add nav link in AppLayout.jsx
{ key: '/teacher/exams', label: t('nav.exams') }
```

---

## Performance Considerations

### Backend
- **Database**: Use indexes on frequently queried columns (id, foreign keys, status)
- **N+1 queries**: Use `@EntityGraph` or explicit joins to avoid
- **Pagination**: Always paginate large result sets
- **Caching**: Cache read-only data (question types, subjects)

### Frontend
- **Code splitting**: Use lazy loading for routes
- **Image optimization**: Compress images (1MB limit)
- **Memoization**: Use `useMemo` and `useCallback` for expensive computations
- **Bundle size**: Monitor chunk sizes (target: < 500KB)

---

## Security Considerations

### Backend
- **Authentication**: JWT tokens in Authorization header
- **Authorization**: Check user role/school in every endpoint
- **Input validation**: Validate all request data
- **SQL injection**: Use parameterized queries (Spring Data JPA)
- **Rate limiting**: Implement per-user rate limits

### Frontend
- **Token storage**: Store JWT in localStorage (vulnerable but necessary)
- **HTTPS only**: All API calls use HTTPS
- **CSRF**: Include CSRF token in state-changing requests
- **XSS prevention**: Never use innerHTML, always use React's JSX

---

## When to Refactor

Consider refactoring when:
- [ ] Code is duplicated in 3+ places
- [ ] A class/function has multiple responsibilities
- [ ] Tests are hard to write
- [ ] New feature requires significant changes to existing code
- [ ] Technical debt is blocking progress

**Refactoring Steps:**
1. Write tests for existing behavior (green)
2. Refactor while keeping tests green
3. Verify no breaking changes
4. Update documentation
5. Review with team

---

## Tools & Visualization

### Create Architecture Diagrams

Use ASCII art for quick sketches:
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────────────────────┐
│   Nginx (port 80/443)       │
│  Reverse proxy, static HTML │
└──────┬──────────────────────┘
       │ HTTP
       ↓
┌─────────────────────────────┐
│   Spring Boot (port 8080)   │
│   API endpoints, auth       │
└──────┬──────────────────────┘
       │ JDBC
       ↓
┌─────────────────────────────┐
│   PostgreSQL                │
│   Database                  │
└─────────────────────────────┘
```

For complex diagrams:
- Use draw.io (free, browser-based)
- Export as PNG
- Embed in documentation

---

## Clean Code & Best Practices

### Meaningful Naming

Variables, functions, and classes must **reveal intent**. Names are the first line of documentation.

**Variables:**
```javascript
// ❌ Bad - cryptic
let d = new Date();
let n = 10;
let u = { name: 'john' };

// ✅ Good - reveal intent
let currentDate = new Date();
let maxRetryCount = 10;
let user = { name: 'john' };
```

**Boolean variables** — Prefix with `is/has/can`:
```javascript
isActive, hasPermission, canEdit, shouldNotify, isValid
```

**Functions** — `verb + noun` pattern:
```javascript
calculateTotal, fetchUser, validateEmail, sendNotification, isValidDate
```

**Classes** — Nouns describing the entity:
```javascript
UserRepository, PaymentService, EmailValidator, AuthController
```

**Constants** — `UPPER_SNAKE_CASE`:
```javascript
MAX_RETRY_COUNT, DEFAULT_TIMEOUT_MS, MAX_FILE_SIZE_MB, ADMIN_EMAIL
```

### Small Functions with Single Responsibility

Each function does **ONE thing well**.

- Maximum **20-30 lines** (ideally under 15)
- Maximum **3 parameters** (use object parameter for more)
- Extract helper functions when logic gets complex
- Name clearly describes what the function does

```java
// ❌ Bad - doing too much
public void processOrder(Order order) {
  // validate order
  // check payment
  // update inventory
  // send confirmation
  // log activity
  // ... 40+ lines
}

// ✅ Good - split into focused functions
public void processOrder(Order order) {
  validateOrder(order);
  processPayment(order);
  updateInventory(order);
  sendConfirmation(order);
  logOrder(order);
}
```

### Pure Functions & Side Effect Minimization

**Pure function**: Same input always produces same output, no side effects.

- Same input = same output, no external state mutation
- Isolate side effects (I/O, DB, API calls) at the edges
- Core business logic should be pure and testable
- Use dependency injection to push side effects outward

```java
// ❌ Impure - depends on external state, has side effects
private double total = 0;
public double addToCart(Item item) {
  total += item.getPrice();  // ← mutates external state
  database.save(item);        // ← side effect
  return total;
}

// ✅ Pure - same input → same output
public double calculateTotal(List<Item> items) {
  return items.stream()
    .mapToDouble(Item::getPrice)
    .sum();
}

// ✅ Side effects isolated at the edges
public double addToCart(Item item) {
  List<Item> newCart = new ArrayList<>(cart);
  newCart.add(item);
  double newTotal = calculateTotal(newCart);  // pure
  database.save(item);                        // side effect (isolated)
  return newTotal;
}
```

### Cyclomatic Complexity Reduction

Maximum **10 paths per function** (ideally under 5).

**Use early returns** to flatten nested conditions:
```java
// ❌ Bad - deeply nested (complexity 5+)
public double calculateDiscount(User user, double amount) {
  if (user != null) {
    if (user.isPremium()) {
      if (amount > 100) {
        if (user.hasVoucher()) {
          return amount * 0.5;
        } else {
          return amount * 0.3;
        }
      } else {
        return amount * 0.1;
      }
    } else {
      return amount * 0.05;
    }
  } else {
    return 0;
  }
}

// ✅ Good - early returns, flat structure (complexity 2)
public double calculateDiscount(User user, double amount) {
  if (user == null) return 0;
  if (!user.isPremium()) return amount * 0.05;
  if (amount <= 100) return amount * 0.1;
  
  double baseDiscount = 0.3;
  double voucherBonus = user.hasVoucher() ? 0.2 : 0;
  return amount * (baseDiscount + voucherBonus);
}
```

**Extract complex conditionals** into named boolean variables:
```java
// ❌ Bad - complex condition hard to read
if (user.getAge() >= 18 && user.isPremium() && (order.getTotal() > 100 || order.getItems().size() > 5)) {
  applySpecialDiscount();
}

// ✅ Good - extract into named variables
boolean isAdult = user.getAge() >= 18;
boolean isPremiumUser = user.isPremium();
boolean qualifiesForDiscount = order.getTotal() > 100 || order.getItems().size() > 5;

if (isAdult && isPremiumUser && qualifiesForDiscount) {
  applySpecialDiscount();
}
```

**Replace switch/case with strategy pattern** or lookup maps:
```java
// ❌ Bad - switch statement, hard to extend
public double getDiscountRate(String userType) {
  switch (userType) {
    case "PREMIUM": return 0.3;
    case "STANDARD": return 0.1;
    case "NEW": return 0.05;
    default: return 0;
  }
}

// ✅ Good - lookup map, easy to extend
private static final Map<String, Double> DISCOUNT_RATES = Map.ofEntries(
  Map.entry("PREMIUM", 0.3),
  Map.entry("STANDARD", 0.1),
  Map.entry("NEW", 0.05)
);

public double getDiscountRate(String userType) {
  return DISCOUNT_RATES.getOrDefault(userType, 0.0);
}
```

**Avoid deep nesting** (max 3 levels):
```javascript
// ❌ Bad - 4+ levels of nesting
for (let i = 0; i < items.length; i++) {
  if (items[i].isValid()) {
    for (let j = 0; j < items[i].prices.length; j++) {
      if (items[i].prices[j] > 0) {
        if (items[i].prices[j] < maxPrice) {
          total += items[i].prices[j];
        }
      }
    }
  }
}

// ✅ Good - extracted into focused loops/functions
const validItems = items.filter(item => item.isValid());
const allPrices = validItems.flatMap(item => item.prices);
const applicablePrices = allPrices.filter(p => p > 0 && p < maxPrice);
const total = applicablePrices.reduce((sum, p) => sum + p, 0);
```

### Separation of Business Logic from Framework

**Golden Rule:** Business rules must NEVER depend on framework code.

- Business logic should be portable between frameworks
- Use adapters/ports to isolate framework dependencies
- Framework is a detail, not the architecture

```java
// ❌ Bad - business logic mixed with Spring framework
@RestController
@RequestMapping("/users")
public class UserController {
  @PostMapping("/register")
  @Validated
  public ResponseEntity<UserDTO> register(@Valid @RequestBody RegisterRequest req) {
    User user = new User(req.getName(), req.getEmail());
    User saved = repository.save(user);
    return ResponseEntity.ok(mapper.toDTO(saved));
  }
}

// ✅ Good - business logic isolated from framework
// Business Service (no Spring dependency)
public class UserService {
  private final UserRepository repository;
  
  public User register(String name, String email) {
    validateEmail(email);
    User user = new User(name, email);
    return repository.save(user);
  }
  
  private void validateEmail(String email) {
    if (!email.contains("@")) throw new InvalidEmailException();
  }
}

// Framework Adapter (Spring controller)
@RestController
@RequestMapping("/users")
public class UserController {
  private final UserService userService;  // ← injected service
  
  @PostMapping("/register")
  public ResponseEntity<UserDTO> register(@RequestBody RegisterRequest req) {
    User user = userService.register(req.getName(), req.getEmail());
    return ResponseEntity.ok(mapper.toDTO(user));
  }
}
```

### Continuous Refactoring

- **Boy Scout Rule**: Leave code better than you found it
- **Refactor in small, safe steps** with tests as safety net
- **Address code smells immediately**, don't let tech debt accumulate
- **Refactoring is not rewriting** — preserve behavior while improving structure

**Code smells to address**:
- Long methods (> 20 lines) → Extract method
- Duplicate code → Extract shared function
- Long parameter lists (> 3) → Use object/map
- Complex conditionals → Extract named variables
- God class (too many responsibilities) → Split into focused classes
- Dead code (unused variables/functions) → Delete
- Magic numbers → Extract constants

---

## Programming Paradigms

Choose the right paradigm for the problem at hand.

### Structured Programming

**When to use:** Scripts, automations, linear processing pipelines

**Characteristics:**
- Sequential execution with control structures (if/else, loops, switch)
- Functions and procedures as organizational units
- Top-down decomposition of problems

```javascript
// ✅ Good structured programming
function processPayrollReport(employees) {
  const report = [];
  
  // Step 1: Validate
  validateEmployeeData(employees);
  
  // Step 2: Calculate
  for (const employee of employees) {
    const amount = calculateSalary(employee);
    report.push({ name: employee.name, amount });
  }
  
  // Step 3: Output
  const summary = calculateTotals(report);
  return generateReport(report, summary);
}
```

### Object-Oriented Programming (OOP)

**When to use:** Complex domains, enterprise systems, stateful entities

**Four pillars:**

1. **Encapsulation** — Data and behaviors united in classes, hide internal state
2. **Inheritance** — Reuse through hierarchies (use with GREAT caution, prefer composition)
3. **Polymorphism** — Same interface, multiple implementations
4. **Abstraction** — Hide complexity, expose only what's necessary

```java
// ✅ Good OOP - encapsulation
public class BankAccount {
  private double balance = 0;  // ← private field
  
  public void deposit(double amount) {
    if (amount <= 0) throw new InvalidAmountException();
    balance += amount;
  }
  
  public double getBalance() {
    return balance;
  }
}
```

### Functional Programming

**When to use:** Data transformation, pipelines, pure domain logic, React components

**Key concepts:**

1. **Immutability** — Data is never altered, only transformed
2. **Pure functions** — Same input = same output, no side effects
3. **Composition** — Small functions combined to create complex behaviors
4. **Higher-order functions** — Functions that receive/return functions
5. **Currying and partial application** — For reusable logic

```javascript
// ✅ Good functional programming
const getAdultUsers = (users) => users.filter(u => u.age >= 18);
const getNames = (users) => users.map(u => u.name);
const sortAlphabetically = (names) => names.sort();

// Compose functions
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const getAdultUserNames = pipe(getAdultUsers, getNames, sortAlphabetically);

const names = getAdultUserNames(users);  // Pure, testable, composable
```

---

## Key Principles

1. **SOLID**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
2. **DRY**: Don't repeat yourself — extract common patterns
3. **YAGNI**: You aren't gonna need it — avoid over-engineering
4. **Fail fast**: Detect errors early, fail with clear messages
5. **Document decisions**: Why, not what (code shows what)
6. **Measure & optimize**: Benchmark before optimizing

---

## Related Documentation

- See `CLAUDE.md` for quick reference
- See `backend/README.md` for backend setup
- See `frontend/README.md` for frontend setup
- See git history for past architecture decisions
