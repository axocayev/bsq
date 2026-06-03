package az.bsq.model.dto.request.question;

import az.bsq.model.enums.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateQuestionRequest {
    @NotBlank
    private String text;
    @NotNull
    private QuestionType type;
    private Long subjectId;
    private String explanation;
    private String imageUrl;
    private List<QuestionOptionRequest> options;
}
