package az.bsq.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DraftAnswerResponse {
    private Long questionId;
    private String answerText;
    private List<Long> selectedOptionIds;
}
