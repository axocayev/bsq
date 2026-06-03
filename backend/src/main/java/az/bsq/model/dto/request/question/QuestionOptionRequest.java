package az.bsq.model.dto.request.question;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class QuestionOptionRequest {
    @NotBlank
    private String text;
    private boolean correct;
    private int displayOrder;
    private String imageUrl;
}
