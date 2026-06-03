package az.bsq.service.strategy;

import az.bsq.model.entity.QuestionOption;
import az.bsq.model.entity.StudentAnswer;
import az.bsq.model.enums.QuestionType;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class MultiSelectStrategy implements AnswerScoringStrategy {

    @Override
    public boolean supports(QuestionType type) {
        return type == QuestionType.MULTI_SELECT;
    }

    @Override
    public void score(StudentAnswer answer, int effectivePoints) {
        Set<Long> correctIds = answer.getQuestion().getOptions().stream()
                .filter(QuestionOption::isCorrect)
                .map(QuestionOption::getId)
                .collect(Collectors.toSet());

        Set<Long> selectedIds = answer.getSelectedOptions().stream()
                .map(QuestionOption::getId)
                .collect(Collectors.toSet());

        boolean exact = correctIds.equals(selectedIds);
        answer.setCorrect(exact);
        answer.setPointsAwarded(exact ? effectivePoints : 0);
    }
}
