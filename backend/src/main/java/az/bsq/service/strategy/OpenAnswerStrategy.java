package az.bsq.service.strategy;

import az.bsq.model.entity.StudentAnswer;
import az.bsq.model.enums.QuestionType;
import org.springframework.stereotype.Component;

@Component
public class OpenAnswerStrategy implements AnswerScoringStrategy {

    @Override
    public boolean supports(QuestionType type) {
        return type == QuestionType.OPEN;
    }

    @Override
    public void score(StudentAnswer answer, int effectivePoints) {
        // Open answers require manual grading — leave correct/pointsAwarded null
    }
}
