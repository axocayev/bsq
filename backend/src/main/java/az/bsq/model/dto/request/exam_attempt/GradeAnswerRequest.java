package az.bsq.model.dto.request.exam_attempt;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class GradeAnswerRequest {
    @NotNull
    private Boolean correct;
    private String comment;
}
