package az.bsq.service.strategy;

import az.bsq.model.entity.QuestionOption;
import az.bsq.model.entity.StudentAnswer;
import az.bsq.model.enums.QuestionType;
import org.springframework.stereotype.Component;

@Component
public class SingleSelectStrategy implements AnswerScoringStrategy {

    @Override
    public boolean supports(QuestionType type) {
        return type == QuestionType.SINGLE_SELECT || type == QuestionType.TRUE_FALSE;
    }

    @Override
    public void score(StudentAnswer answer, int effectivePoints) {
        if (answer.getSelectedOptions().isEmpty()) {
            answer.setCorrect(false);
            answer.setPointsAwarded(0);
            return;
        }
        QuestionOption selected = answer.getSelectedOptions().get(0);
        boolean correct = selected.isCorrect();
        answer.setCorrect(correct);
        answer.setPointsAwarded(correct ? effectivePoints : 0);
    }
}
