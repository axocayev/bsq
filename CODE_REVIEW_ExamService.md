# Code Review: ExamServiceImpl
**Based on Software Architecture Skill Guidelines**

**File:** `backend/src/main/java/az/bsq/service/impl/ExamServiceImpl.java`

**Date:** June 1, 2026

---

## ✅ STRENGTHS

### 1. Excellent Separation of Concerns
- **Clean:** Business logic is separated from Spring Framework
- **Service layer** handles business rules (status transitions, validations)
- **DTOs** properly used for request/response mapping
- **Repositories** abstracted away (not using EntityManager directly)

### 2. Good Naming Conventions
- ✅ Method names are clear and action-oriented:
  - `submitForApproval()` — clear intent
  - `assignStudents()` — verb + noun pattern
  - `requireEditable()` — boolean check with "require" prefix
  - `getExam()` — standard getter pattern

- ✅ Variable names reveal intent:
  - `examId`, `studentId`, `teacherId` — clear identifiers
  - `newStartDate` — reveals it's a new value
  - `compositeId` — reveals the purpose

### 3. Proper Transaction Management
- ✅ `@Transactional` annotations correctly placed
- ✅ Read-only queries marked with `readOnly = true`
- ✅ No N+1 query problems (using custom queries with `findByExamIdWithQuestion`)

### 4. Good Error Handling
- ✅ Custom exceptions (`BsqException`, `ResourceNotFoundException`)
- ✅ Clear error messages with codes (e.g., `EXAM_NOT_EDITABLE`)
- ✅ Proper HTTP status codes

### 5. Business Logic Encapsulation
- ✅ Status transition logic is protected (`requireEditable()`)
- ✅ School isolation enforced (school mismatch check)
- ✅ Role-based validation (student check in `assignStudents()`)

---

## ⚠️ ISSUES & RECOMMENDATIONS

### ISSUE #1: Cyclomatic Complexity - `assignStudents()` Method (Lines 214-239)

**Severity:** Medium  
**Complexity:** ~7 (exceeds recommended max of 5)

```java
// ❌ Current: Complex logic mixed together
return request.getStudentIds().stream().map(studentId -> {
    if (assignmentRepository.existsByExamIdAndStudentId(examId, studentId)) {
        return null;  // ← returns null, then filters it out
    }
    User student = userRepository.findByIdAndActiveTrue(studentId)
            .filter(u -> u.getRole() == Role.STUDENT && ...)
            .orElseThrow(...);
    String otp = String.format("%06d", new java.util.Random().nextInt(1_000_000));
    ExamAssignment assignment = ExamAssignment.builder()
            .exam(exam)
            .student(student)
            ...
            .build();
    return toAssignmentResponse(assignmentRepository.save(assignment));
}).filter(a -> a != null).toList();
```

**✅ Recommended:** Extract helper methods

```java
@Transactional
public List<ExamAssignmentResponse> assignStudents(Long examId, AssignStudentsRequest request) {
    Exam exam = getExam(examId);
    validateExamAssignable(exam);
    User teacher = userService.getActive(securityUtils.getCurrentUserId());

    return request.getStudentIds().stream()
            .filter(studentId -> !isAlreadyAssigned(examId, studentId))
            .map(studentId -> createAssignment(exam, studentId, request.getDeadline(), teacher))
            .toList();
}

private boolean isAlreadyAssigned(Long examId, Long studentId) {
    return assignmentRepository.existsByExamIdAndStudentId(examId, studentId);
}

private ExamAssignmentResponse createAssignment(Exam exam, Long studentId, 
                                                  LocalDateTime deadline, User teacher) {
    User student = validateAndGetStudent(studentId, exam);
    String otp = generateOtp();
    ExamAssignment assignment = buildAssignment(exam, student, teacher, deadline, otp);
    return toAssignmentResponse(assignmentRepository.save(assignment));
}

private String generateOtp() {
    return String.format("%06d", new java.util.Random().nextInt(1_000_000));
}
```

**Why:** Easier to test, understand, and maintain

---

### ISSUE #2: Random OTP Generation Not Deterministic (Line 229)

**Severity:** Medium  
**Type:** Side effect + testability concern

```java
// ❌ Current: New Random created each time
String otp = String.format("%06d", new java.util.Random().nextInt(1_000_000));
```

**Problems:**
- Creates new `Random` instance each time (inefficient)
- Hard to test (unpredictable values)
- No seed control

**✅ Recommended:** Inject or use utility

```java
// Option 1: Extract to utility service
@Service
public class OtpService {
    private final Random random = new Random();
    
    public String generateOtp() {
        return String.format("%06d", random.nextInt(1_000_000));
    }
}

// Option 2: Use SecureRandom for production
public class OtpService {
    private final SecureRandom secureRandom = new SecureRandom();
    
    public String generateOtp() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }
}

// In ExamServiceImpl:
@Service
@RequiredArgsConstructor
public class ExamServiceImpl {
    private final OtpService otpService;
    
    private String generateOtp() {
        return otpService.generateOtp();
    }
}
```

**Why:** Better testing, separation of concerns, secure random

---

### ISSUE #3: Inline Mapping Logic - toResponse() Methods (Lines 261-279, 336-361)

**Severity:** Low  
**Type:** Should use MapStruct

```java
// ❌ Current: Manual mapping in service
public ExamResponse toResponse(Exam e) {
    return ExamResponse.builder()
            .id(e.getId())
            .title(e.getTitle())
            // ... 8 more lines
            .build();
}
```

**Problem:**
- Manual mapping is error-prone
- No compile-time safety
- Duplicated in `buildAssignmentResponse()`

**✅ Recommended:** Use MapStruct (already in project)

```java
@Mapper
public interface ExamMapper {
    ExamResponse toResponse(Exam exam);
    ExamAssignmentResponse toAssignmentResponse(ExamAssignment assignment);
    
    @Mapping(target = "otpCode", ignore = true)
    ExamAssignmentResponse toAssignmentResponseWithoutOtp(ExamAssignment assignment);
}

// In ExamServiceImpl:
@Service
@RequiredArgsConstructor
public class ExamServiceImpl {
    private final ExamMapper examMapper;
    
    public ExamResponse toResponse(Exam exam) {
        return examMapper.toResponse(exam);
    }
}
```

**Why:** Type-safe, generated code, DRY principle

---

### ISSUE #4: Update Method Duplication (Lines 88-103)

**Severity:** Low  
**Type:** Code smell - similar logic in two methods

```java
// ❌ Current: Duplicated with slight differences
public ExamResponse update(Long id, CreateExamRequest request) {
    Exam exam = getExam(id);
    if (exam.getStatus() == ExamStatus.DRAFT || exam.getStatus() == ExamStatus.REJECTED) {
        return applyUpdate(exam, request);
    }
    if (exam.getStartDate() != null && LocalDateTime.now().isBefore(exam.getStartDate())) {
        return applyUpdate(exam, request);
    }
    throw new BsqException(...);
}

public ExamResponse adminUpdate(Long id, CreateExamRequest request) {
    return applyUpdate(getExam(id), request);  // ← No validation
}
```

**✅ Recommended:** Extract validation logic

```java
public ExamResponse update(Long id, CreateExamRequest request) {
    Exam exam = getExam(id);
    validateEditableByTeacher(exam);
    return applyUpdate(exam, request);
}

public ExamResponse adminUpdate(Long id, CreateExamRequest request) {
    return applyUpdate(getExam(id), request);
}

private void validateEditableByTeacher(Exam exam) {
    boolean isDraft = exam.getStatus() == ExamStatus.DRAFT || 
                      exam.getStatus() == ExamStatus.REJECTED;
    boolean isBeforeStart = exam.getStartDate() != null && 
                            LocalDateTime.now().isBefore(exam.getStartDate());
    
    if (!isDraft && !isBeforeStart) {
        throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_EDITABLE", 
                              "Exam cannot be edited at this stage");
    }
}
```

**Why:** DRY principle, easier to test, clearer intent

---

### ISSUE #5: Status Check Duplication (Lines 91, 157, 174, etc.)

**Severity:** Low  
**Type:** Repeated status checks scattered throughout

```java
// ❌ Current: Same checks in multiple places
if (exam.getStatus() == ExamStatus.DRAFT || exam.getStatus() == ExamStatus.REJECTED)
if (exam.getStatus() != ExamStatus.PENDING_APPROVAL)
if (exam.getStatus() != ExamStatus.APPROVED)
```

**✅ Recommended:** Extract validation methods

```java
private void validateEditable(Exam exam) {
    boolean isEditable = exam.getStatus() == ExamStatus.DRAFT || 
                         exam.getStatus() == ExamStatus.REJECTED;
    if (!isEditable) {
        throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_EDITABLE", 
                              "Exam is not in editable status");
    }
}

private void validatePendingApproval(Exam exam) {
    if (exam.getStatus() != ExamStatus.PENDING_APPROVAL) {
        throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_PENDING", 
                              "Exam must be PENDING_APPROVAL");
    }
}

private void validatePublished(Exam exam) {
    if (exam.getStatus() != ExamStatus.PUBLISHED) {
        throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_PUBLISHED", 
                              "Exam must be PUBLISHED");
    }
}

// Usage:
public ExamResponse approve(Long id) {
    Exam exam = getExam(id);
    validatePendingApproval(exam);
    exam.setStatus(ExamStatus.PUBLISHED);
    exam.setApprovalNote(null);
    return toResponse(exam);
}
```

**Why:** Single source of truth, easier to maintain, clearer code

---

## 📋 CODE REVIEW CHECKLIST

| Item | Status | Notes |
|------|--------|-------|
| **Naming Clarity** | ✅ Pass | Clear method and variable names |
| **Function Size** | ⚠️ Needs Review | `assignStudents()` is 26 lines, should be < 20 |
| **Single Responsibility** | ✅ Pass | Each method has one clear purpose |
| **Pure Functions** | ⚠️ Improvement Needed | OTP generation is impure, should be injected |
| **Cyclomatic Complexity** | ⚠️ Medium | Several methods have score > 5 |
| **Duplication** | ⚠️ Moderate | Status checks repeated 5+ times |
| **Error Handling** | ✅ Pass | Good exception handling |
| **No Hard Dependencies** | ✅ Pass | Properly uses DI |
| **Framework Separation** | ✅ Pass | Business logic isolated from Spring |
| **Comments/Documentation** | ✅ Pass | Code is self-explanatory |

---

## 🎯 Priority Fixes

### High Priority
1. **Extract OTP generation** to separate service (enables testing, reusability)
2. **Reduce `assignStudents()` complexity** by extracting helper methods

### Medium Priority
3. **Use MapStruct** for entity-to-DTO mapping instead of manual builders
4. **Extract status validation** methods to reduce duplication

### Low Priority
5. Update documentation with new helper methods

---

## 📊 Summary

**Overall Score: 7.5/10**

| Category | Score | Status |
|----------|-------|--------|
| Naming | 9/10 | ✅ Excellent |
| Function Size | 7/10 | ⚠️ Needs improvement |
| Complexity | 6/10 | ⚠️ Some high-complexity methods |
| Error Handling | 9/10 | ✅ Excellent |
| Architecture | 9/10 | ✅ Excellent separation |
| Testing | 6/10 | ⚠️ Hard to test OTP generation |
| Maintainability | 7/10 | ⚠️ Some duplication |

---

## ✨ What's Working Well

1. **Excellent architecture** — Business logic properly separated from framework
2. **Great naming** — Methods and variables clearly reveal intent
3. **Proper transactions** — No N+1 queries, appropriate transaction boundaries
4. **Good error handling** — Custom exceptions with clear messages
5. **Security-conscious** — School isolation, role validation

---

## 🔧 Implementation Example

Here's how to apply the main recommendations:

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ExamServiceImpl {
    // ... existing fields ...
    private final OtpService otpService;           // ← NEW
    private final ExamMapper examMapper;           // ← NEW

    // ... existing code ...

    @Transactional
    public List<ExamAssignmentResponse> assignStudents(Long examId, AssignStudentsRequest request) {
        Exam exam = getExam(examId);
        validateExamAssignable(exam);
        User teacher = userService.getActive(securityUtils.getCurrentUserId());

        return request.getStudentIds().stream()
                .filter(studentId -> !isAlreadyAssigned(examId, studentId))
                .map(studentId -> createAssignment(exam, studentId, request.getDeadline(), teacher))
                .toList();
    }

    private boolean isAlreadyAssigned(Long examId, Long studentId) {
        return assignmentRepository.existsByExamIdAndStudentId(examId, studentId);
    }

    private void validateExamAssignable(Exam exam) {
        if (exam.getStatus() == ExamStatus.CLOSED || exam.getStatus() == ExamStatus.ARCHIVED) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_ASSIGNABLE", 
                                  "Cannot assign students to a closed or archived exam");
        }
    }

    private ExamAssignmentResponse createAssignment(Exam exam, Long studentId, 
                                                      LocalDateTime deadline, User teacher) {
        User student = validateAndGetStudent(studentId, exam);
        String otp = otpService.generateOtp();  // ← Use injected service
        
        ExamAssignment assignment = ExamAssignment.builder()
                .exam(exam)
                .student(student)
                .assignedBy(teacher)
                .deadline(deadline)
                .otpCode(otp)
                .build();
                
        return toAssignmentResponse(assignmentRepository.save(assignment));
    }

    private User validateAndGetStudent(Long studentId, Exam exam) {
        return userRepository.findByIdAndActiveTrue(studentId)
                .filter(u -> u.getRole() == Role.STUDENT && 
                           u.getSchool() != null &&
                           u.getSchool().getId().equals(exam.getSchool().getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
    }

    // Use MapStruct instead
    private ExamResponse toResponse(Exam exam) {
        return examMapper.toResponse(exam);
    }
}
```

---

**Review completed by:** Claude Architecture Skill  
**Recommended next step:** Create OtpService and extract helper methods from `assignStudents()`
