package az.bsq.model.dto.request.exam_attempt;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SubmitExamRequest {
    @NotNull
    private List<AnswerRequest> answers;
}
