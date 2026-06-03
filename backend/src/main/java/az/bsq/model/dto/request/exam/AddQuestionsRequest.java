package az.bsq.model.dto.request.exam;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AddQuestionsRequest {
    @NotEmpty
    private List<Long> questionIds;
}
