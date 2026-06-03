package az.bsq.model.dto.request.exam;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChangeStartTimeRequest {
    @NotNull
    private LocalDateTime startDate;
}
