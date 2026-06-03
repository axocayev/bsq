package az.bsq.model.dto.response;

import az.bsq.model.enums.QuestionType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/** Question response for active exam — no isCorrect flags on options. */
@Data
@Builder
public class StudentQuestionResponse {
    private Long id;
    private String text;
    private QuestionType type;
    private int points;
    private int displayOrder;
    private String imageUrl;
    private List<StudentOptionResponse> options;
}
