package az.bsq.model.dto.request.school;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSchoolRequest {
    @NotBlank
    private String name;
    private String code;
}
