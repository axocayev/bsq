package az.bsq.exception;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BsqException.class)
    public ResponseEntity<ErrorResponse> handleBsqException(BsqException ex) {
        log.warn("BsqException: {} - {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(ex.getStatus())
                .body(ErrorResponse.builder()
                        .code(ex.getErrorCode())
                        .message(ex.getMessage())
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(ErrorResponse.builder()
                .code("VALIDATION_ERROR")
                .message("Validation failed")
                .fieldErrors(fieldErrors)
                .build());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        String detail = ex.getMostSpecificCause().getMessage();
        String message = resolveConstraintMessage(detail);
        log.warn("Data integrity violation: {}", detail);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.builder().code("CONSTRAINT_VIOLATION").message(message).build());
    }

    private String resolveConstraintMessage(String detail) {
        if (detail == null) return "Operation not allowed — referenced records exist";
        if (detail.contains("fk_assignment_exam"))        return "Cannot delete this exam — it has student assignments";
        if (detail.contains("fk_exam_question_question")) return "Cannot delete this question — it is used in an exam";
        if (detail.contains("fk_student_answer_question"))return "Cannot delete this question — it has student answers";
        if (detail.contains("fk_answer_option"))          return "Cannot delete this option — it appears in student answers";
        if (detail.contains("fk_assignment_student"))     return "Cannot delete this user — they have exam assignments";
        if (detail.contains("fk_question_creator"))       return "Cannot delete this user — they have created questions";
        if (detail.contains("fk_exam_creator"))           return "Cannot delete this user — they have created exams";
        if (detail.contains("fk_user_school"))            return "Cannot delete this school — it has active users";
        if (detail.contains("fk_question_school"))        return "Cannot delete this school — it has questions";
        if (detail.contains("fk_exam_school"))            return "Cannot delete this school — it has exams";
        return "Operation not allowed — referenced records exist";
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.builder().code("ACCESS_DENIED").message(ex.getMessage()).build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.builder().code("INTERNAL_ERROR").message("An unexpected error occurred").build());
    }

    @Data
    @Builder
    public static class ErrorResponse {
        private String code;
        private String message;
        @Builder.Default
        private LocalDateTime timestamp = LocalDateTime.now();
        private Map<String, String> fieldErrors;
    }
}
