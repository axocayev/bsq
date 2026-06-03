package az.bsq.controller;

import az.bsq.model.dto.request.exam.CreateExamRequest;
import az.bsq.model.dto.request.exam.RejectExamRequest;
import az.bsq.model.dto.request.subject.CreateSubjectRequest;
import az.bsq.model.dto.response.SubjectResponse;
import az.bsq.service.impl.SubjectServiceImpl;
import az.bsq.model.dto.request.school.CreateSchoolRequest;
import az.bsq.model.dto.request.user.CreateUserRequest;
import az.bsq.model.dto.request.user.ResetPasswordRequest;
import az.bsq.model.dto.request.user.UpdateUserRequest;
import az.bsq.model.dto.response.ExamResponse;
import az.bsq.model.dto.response.SchoolResponse;
import az.bsq.model.dto.response.UserResponse;
import az.bsq.service.impl.ExamServiceImpl;
import az.bsq.service.impl.SchoolServiceImpl;
import az.bsq.service.impl.UserServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final SchoolServiceImpl schoolService;
    private final UserServiceImpl userService;
    private final ExamServiceImpl examService;
    private final SubjectServiceImpl subjectService;

    @GetMapping("/schools")
    public Page<SchoolResponse> listSchools(Pageable pageable) {
        return schoolService.findAll(pageable);
    }

    @PostMapping("/schools")
    public ResponseEntity<SchoolResponse> createSchool(@Valid @RequestBody CreateSchoolRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(schoolService.create(request));
    }

    @GetMapping("/schools/{id}")
    public SchoolResponse getSchool(@PathVariable Long id) {
        return schoolService.findById(id);
    }

    @PutMapping("/schools/{id}")
    public SchoolResponse updateSchool(@PathVariable Long id, @Valid @RequestBody CreateSchoolRequest request) {
        return schoolService.update(id, request);
    }

    @DeleteMapping("/schools/{id}")
    public ResponseEntity<Void> deleteSchool(@PathVariable Long id) {
        schoolService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public Page<UserResponse> listUsers(Pageable pageable) {
        return userService.findAll(pageable);
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
    }

    @GetMapping("/users/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PutMapping("/users/{id}")
    public UserResponse updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<Void> resetUserPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(id, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/exams")
    public Page<ExamResponse> listExams(Pageable pageable) {
        return examService.findAll(pageable);
    }

    @PutMapping("/exams/{id}")
    public ExamResponse updateExam(@PathVariable Long id, @Valid @RequestBody CreateExamRequest request) {
        return examService.adminUpdate(id, request);
    }

    @PostMapping("/exams/{id}/approve")
    public ExamResponse approveExam(@PathVariable Long id) {
        return examService.approve(id);
    }

    @PostMapping("/exams/{id}/reject")
    public ExamResponse rejectExam(@PathVariable Long id, @RequestBody RejectExamRequest request) {
        return examService.reject(id, request);
    }

    // --- Subjects (admin-only CRUD) ---

    @GetMapping("/subjects")
    public List<SubjectResponse> listSubjects() {
        return subjectService.findAll();
    }

    @PostMapping("/subjects")
    public ResponseEntity<SubjectResponse> createSubject(@Valid @RequestBody CreateSubjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subjectService.create(request));
    }

    @PutMapping("/subjects/{id}")
    public SubjectResponse updateSubject(@PathVariable Long id, @Valid @RequestBody CreateSubjectRequest request) {
        return subjectService.update(id, request);
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable Long id) {
        subjectService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
