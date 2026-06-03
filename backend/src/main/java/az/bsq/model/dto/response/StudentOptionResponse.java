package az.bsq.model.dto.response;

import lombok.Builder;
import lombok.Data;

/** Option response for students during active exam — isCorrect intentionally omitted. */
@Data
@Builder
public class StudentOptionResponse {
    private Long id;
    private String text;
    private int displayOrder;
    private String imageUrl;
}
