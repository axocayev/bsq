package az.bsq.controller;

import az.bsq.model.dto.request.exam_attempt.AnswerRequest;
import az.bsq.model.dto.request.exam_attempt.StartExamRequest;
import az.bsq.model.dto.request.exam_attempt.SubmitExamRequest;
import az.bsq.model.dto.response.ExamAssignmentResponse;
import az.bsq.model.dto.response.ExamResultResponse;
import az.bsq.model.dto.response.StartExamResponse;
import az.bsq.service.impl.ExamAttemptServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/student")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
public class StudentController {

    private final ExamAttemptServiceImpl attemptService;

    @GetMapping("/exams")
    public Page<ExamAssignmentResponse> myExams(Pageable pageable) {
        return attemptService.getMyExams(pageable);
    }

    @PostMapping("/exams/{examId}/start")
    public ResponseEntity<StartExamResponse> startExam(@PathVariable Long examId,
                                                        @RequestBody StartExamRequest request) {
        return ResponseEntity.ok(attemptService.startExam(examId, request.getOtpCode()));
    }

    @PutMapping("/exams/{examId}/answer")
    public ResponseEntity<Void> saveAnswer(@PathVariable Long examId, @RequestBody AnswerRequest request) {
        attemptService.saveAnswer(examId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/exams/{examId}/submit")
    public ResponseEntity<ExamResultResponse> submitExam(@PathVariable Long examId,
                                                          @Valid @RequestBody SubmitExamRequest request) {
        return ResponseEntity.ok(attemptService.submitExam(examId, request));
    }

    @GetMapping("/exams/{examId}/result")
    public ResponseEntity<ExamResultResponse> getResult(@PathVariable Long examId) {
        return ResponseEntity.ok(attemptService.getResult(examId));
    }
}
