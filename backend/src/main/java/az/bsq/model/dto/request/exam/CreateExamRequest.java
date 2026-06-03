package az.bsq.model.dto.request.exam;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateExamRequest {
    @NotBlank
    private String title;
    private String description;
    @Positive
    private int durationMin;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private boolean shuffled;
}
