package az.bsq.model.dto.request.exam;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateQuestionPointsRequest {
    @NotNull
    @Min(0)
    private Integer points;
}
