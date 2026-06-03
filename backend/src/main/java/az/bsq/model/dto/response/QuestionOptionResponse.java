package az.bsq.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuestionOptionResponse {
    private Long id;
    private String text;
    private boolean correct;
    private int displayOrder;
    private String imageUrl;
}
