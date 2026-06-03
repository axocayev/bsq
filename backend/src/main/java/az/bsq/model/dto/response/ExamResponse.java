package az.bsq.model.dto.response;

import az.bsq.model.enums.ExamStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ExamResponse {
    private Long id;
    private String title;
    private String description;
    private int durationMin;
    private ExamStatus status;
    private Long schoolId;
    private String schoolName;
    private Long createdById;
    private String createdByName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private boolean shuffled;
    private int questionCount;
    private String approvalNote;
    private LocalDateTime createdAt;
}
