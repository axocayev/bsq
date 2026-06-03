package az.bsq.model.dto.request.subject;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSubjectRequest {
    @NotBlank
    private String name;
}
