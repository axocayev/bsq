package az.bsq.service.strategy;

import az.bsq.model.entity.StudentAnswer;
import az.bsq.model.enums.QuestionType;

public interface AnswerScoringStrategy {
    boolean supports(QuestionType type);
    void score(StudentAnswer answer, int effectivePoints);
}
