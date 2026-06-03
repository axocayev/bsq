package az.bsq.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class StartExamResponse {
    private Long assignmentId;
    private Long examId;
    private String examTitle;
    private int durationMin;
    private LocalDateTime startedAt;
    private long remainingSeconds;
    private long serverNow;
    private long examEndsAt;
    private List<StudentQuestionResponse> questions;
    private List<DraftAnswerResponse> savedAnswers;
}
