package az.bsq.controller;

import az.bsq.model.dto.request.exam.AddQuestionsRequest;
import az.bsq.model.dto.request.exam.AssignStudentsRequest;
import az.bsq.model.dto.request.exam.CreateExamRequest;
import az.bsq.model.dto.request.exam.UpdateQuestionPointsRequest;
import az.bsq.model.dto.request.subject.CreateSubjectRequest;
import az.bsq.model.dto.response.SubjectResponse;
import az.bsq.model.dto.request.exam_attempt.GradeAnswerRequest;
import az.bsq.model.dto.request.question.CreateQuestionRequest;
import az.bsq.model.dto.response.*;
import az.bsq.service.impl.ExamAttemptServiceImpl;
import az.bsq.service.impl.ExamServiceImpl;
import az.bsq.service.impl.QuestionServiceImpl;
import az.bsq.service.impl.SubjectServiceImpl;
import az.bsq.service.impl.UserServiceImpl;
import az.bsq.model.enums.Role;
import az.bsq.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/teacher")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
public class TeacherController {

    private final QuestionServiceImpl questionService;
    private final ExamServiceImpl examService;
    private final ExamAttemptServiceImpl attemptService;
    private final UserServiceImpl userService;
    private final SubjectServiceImpl subjectService;
    private final SecurityUtils securityUtils;

    // --- Subjects (read-only for teacher) ---

    @GetMapping("/subjects")
    public List<SubjectResponse> listSubjects() {
        return subjectService.findAll();
    }

    // --- Questions ---

    @GetMapping("/questions")
    public Page<QuestionResponse> myQuestions(@RequestParam(required = false) String search, Pageable pageable) {
        return questionService.findMyQuestions(search, pageable);
    }

    @PostMapping("/questions")
    public ResponseEntity<QuestionResponse> createQuestion(@Valid @RequestBody CreateQuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.create(request));
    }

    @GetMapping("/questions/{id}")
    public QuestionResponse getQuestion(@PathVariable Long id) {
        return questionService.findById(id);
    }

    @PutMapping("/questions/{id}")
    public QuestionResponse updateQuestion(@PathVariable Long id, @Valid @RequestBody CreateQuestionRequest request) {
        return questionService.update(id, request);
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        questionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // --- Students (same school, for exam assignment) ---

    @GetMapping("/students")
    public Page<UserResponse> getStudents(Pageable pageable) {
        Long schoolId = securityUtils.getCurrentUserSchoolId();
        return userService.findBySchoolAndRole(schoolId, Role.STUDENT, pageable);
    }

    // --- Exams ---

    @GetMapping("/exams")
    public Page<ExamResponse> myExams(Pageable pageable) {
        return examService.findMyExams(pageable);
    }

    @PostMapping("/exams")
    public ResponseEntity<ExamResponse> createExam(@Valid @RequestBody CreateExamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examService.create(request));
    }

    @GetMapping("/exams/{id}")
    public ExamResponse getExam(@PathVariable Long id) {
        return examService.findById(id);
    }

    @PutMapping("/exams/{id}")
    public ExamResponse updateExam(@PathVariable Long id, @Valid @RequestBody CreateExamRequest request) {
        return examService.update(id, request);
    }

    @DeleteMapping("/exams/{id}")
    public ResponseEntity<Void> deleteExam(@PathVariable Long id) {
        examService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/exams/{id}/questions")
    public ResponseEntity<Void> addQuestions(@PathVariable Long id, @Valid @RequestBody AddQuestionsRequest request) {
        examService.addQuestions(id, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/exams/{id}/questions/{questionId}")
    public ResponseEntity<Void> removeQuestion(@PathVariable Long id, @PathVariable Long questionId) {
        examService.removeQuestion(id, questionId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/exams/{id}/questions/{questionId}/points")
    public ResponseEntity<Void> updateQuestionPoints(@PathVariable Long id, @PathVariable Long questionId,
                                                      @Valid @RequestBody UpdateQuestionPointsRequest request) {
        examService.updateQuestionPoints(id, questionId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/exams/{id}/submit")
    public ExamResponse submitForApproval(@PathVariable Long id) {
        return examService.submitForApproval(id);
    }

    @PostMapping("/exams/{id}/close")
    public ExamResponse closeExam(@PathVariable Long id) {
        return examService.close(id);
    }

    @GetMapping("/exams/{id}/questions")
    public List<QuestionResponse> getExamQuestions(@PathVariable Long id) {
        return examService.getExamQuestions(id);
    }

    @GetMapping("/exams/{id}/assignments")
    public List<ExamAssignmentResponse> getExamAssignments(@PathVariable Long id) {
        return examService.getExamAssignments(id);
    }

    @PostMapping("/exams/{id}/assign")
    public List<ExamAssignmentResponse> assignStudents(@PathVariable Long id,
                                                        @Valid @RequestBody AssignStudentsRequest request) {
        return examService.assignStudents(id, request);
    }

    // --- Grading ---

    @GetMapping("/assignments/{assignmentId}/answers")
    public List<AnswerResultResponse> getAnswersForGrading(@PathVariable Long assignmentId) {
        return attemptService.getAnswersForGrading(assignmentId);
    }

    @PostMapping("/answers/{answerId}/grade")
    public ResponseEntity<Void> gradeAnswer(@PathVariable Long answerId,
                                             @Valid @RequestBody GradeAnswerRequest request) {
        attemptService.gradeOpenAnswer(answerId, request);
        return ResponseEntity.ok().build();
    }
}
