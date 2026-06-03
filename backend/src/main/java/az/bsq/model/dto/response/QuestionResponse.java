package az.bsq.model.dto.response;

import az.bsq.model.enums.QuestionType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuestionResponse {
    private Long id;
    private String text;
    private QuestionType type;
    private int points;
    private String explanation;
    private String imageUrl;
    private List<QuestionOptionResponse> options;
    private Long createdById;
    private String createdByName;
    private Long subjectId;
    private String subjectName;
    private boolean inUse;
    private LocalDateTime createdAt;
}
