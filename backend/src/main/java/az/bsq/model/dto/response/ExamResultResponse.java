package az.bsq.model.dto.response;

import az.bsq.model.enums.ExamAttemptStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ExamResultResponse {
    private Long assignmentId;
    private Long examId;
    private String examTitle;
    private ExamAttemptStatus status;
    private Integer autoScore;
    private Integer finalScore;
    private Integer maxScore;
    private LocalDateTime submittedAt;
    private List<AnswerResultResponse> answers;
}
