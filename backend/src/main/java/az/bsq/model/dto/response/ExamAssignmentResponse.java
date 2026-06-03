package az.bsq.model.dto.response;

import az.bsq.model.enums.ExamAttemptStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ExamAssignmentResponse {
    private Long id;
    private Long examId;
    private String examTitle;
    private int durationMin;
    private Long studentId;
    private String studentName;
    private ExamAttemptStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime deadline;
    private Integer autoScore;
    private Integer finalScore;
    private LocalDateTime assignedAt;
    private String otpCode; // only populated for school-admin responses
}
