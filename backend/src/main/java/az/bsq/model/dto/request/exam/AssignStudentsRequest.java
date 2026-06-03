package az.bsq.model.dto.request.exam;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class AssignStudentsRequest {
    @NotEmpty
    private List<Long> studentIds;
    private LocalDateTime deadline;
}
