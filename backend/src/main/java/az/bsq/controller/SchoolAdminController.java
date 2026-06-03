package az.bsq.controller;

import az.bsq.model.dto.request.exam.ChangeStartTimeRequest;
import az.bsq.model.dto.request.exam.CreateExamRequest;
import az.bsq.model.dto.request.exam.RejectExamRequest;
import az.bsq.model.dto.response.ExamAssignmentResponse;
import az.bsq.model.dto.request.subject.CreateSubjectRequest;
import az.bsq.model.dto.request.user.CreateUserRequest;
import az.bsq.model.dto.request.user.ResetPasswordRequest;
import az.bsq.model.dto.request.user.UpdateUserRequest;
import az.bsq.model.dto.response.ExamResponse;
import az.bsq.model.dto.response.ExamResultResponse;
import az.bsq.model.dto.response.SubjectResponse;
import az.bsq.model.dto.response.UserResponse;
import az.bsq.model.enums.Role;
import az.bsq.service.impl.ExamAttemptServiceImpl;
import az.bsq.service.impl.ExamServiceImpl;
import az.bsq.service.impl.SubjectServiceImpl;
import az.bsq.service.impl.UserServiceImpl;
import az.bsq.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/school-admin")
@PreAuthorize("hasRole('SCHOOL_ADMIN')")
@RequiredArgsConstructor
public class SchoolAdminController {

    private final UserServiceImpl userService;
    private final ExamServiceImpl examService;
    private final ExamAttemptServiceImpl attemptService;
    private final SubjectServiceImpl subjectService;
    private final SecurityUtils securityUtils;

    @GetMapping("/users")
    public Page<UserResponse> listUsers(@RequestParam(required = false) Role role, Pageable pageable) {
        Long schoolId = securityUtils.getCurrentUserSchoolId();
        return role != null
                ? userService.findBySchoolAndRole(schoolId, role, pageable)
                : userService.findBySchool(schoolId, pageable);
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        request.setSchoolId(securityUtils.getCurrentUserSchoolId());
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
        return examService.findBySchool(securityUtils.getCurrentUserSchoolId(), pageable);
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

    @PutMapping("/exams/{id}/start-time")
    public ExamResponse changeStartTime(@PathVariable Long id, @Valid @RequestBody ChangeStartTimeRequest request) {
        return examService.changeStartTime(id, request.getStartDate());
    }

    @GetMapping("/exams/{id}/assignments")
    public List<ExamAssignmentResponse> getExamAssignments(@PathVariable Long id) {
        return examService.getExamAssignmentsWithOtp(id);
    }

    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<Void> removeAssignment(@PathVariable Long id) {
        examService.removeAssignment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assignments/{id}/result")
    public ExamResultResponse getAssignmentResult(@PathVariable Long id) {
        return attemptService.getResultByAssignmentId(id);
    }

    @GetMapping("/subjects")
    public List<SubjectResponse> listSubjects() {
        return subjectService.findAll();
    }
}
