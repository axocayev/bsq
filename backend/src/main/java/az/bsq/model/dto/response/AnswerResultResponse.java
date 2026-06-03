package az.bsq.model.dto.response;

import az.bsq.model.enums.QuestionType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AnswerResultResponse {
    private Long answerId;
    private Long questionId;
    private String questionText;
    private String questionImageUrl;
    private QuestionType questionType;
    private String answerText;
    private List<Long> selectedOptionIds;
    private List<OptionResultResponse> options;
    private Boolean correct;
    private Integer pointsAwarded;
    private Integer maxPoints;
    private String teacherComment;
    private String explanation;
    private boolean pendingGrade;

    @Data
    @Builder
    public static class OptionResultResponse {
        private Long id;
        private String text;
        private String imageUrl;
        private boolean correct;
        private boolean selected;
    }
}
