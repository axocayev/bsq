package az.bsq.scheduler;

import az.bsq.dao.ExamAssignmentRepository;
import az.bsq.dao.StudentAnswerRepository;
import az.bsq.model.entity.ExamAssignment;
import az.bsq.model.enums.ExamAttemptStatus;
import az.bsq.model.enums.QuestionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExamTimerScheduler {

    private final ExamAssignmentRepository assignmentRepository;
    private final StudentAnswerRepository answerRepository;

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void autoSubmitTimedOutExams() {
        List<ExamAssignment> timedOut = assignmentRepository.findTimedOutAssignments(LocalDateTime.now());
        if (timedOut.isEmpty()) return;

        log.info("Auto-submitting {} timed-out exam assignments", timedOut.size());

        for (ExamAssignment assignment : timedOut) {
            try {
                int autoScore = answerRepository.findByAssignmentId(assignment.getId()).stream()
                        .filter(a -> a.getQuestion().getType() != QuestionType.OPEN && a.getPointsAwarded() != null)
                        .mapToInt(a -> a.getPointsAwarded())
                        .sum();

                boolean hasOpenQuestions = answerRepository.findByAssignmentId(assignment.getId()).stream()
                        .anyMatch(a -> a.getQuestion().getType() == QuestionType.OPEN);

                assignment.setAutoScore(autoScore);
                assignment.setSubmittedAt(LocalDateTime.now());

                if (!hasOpenQuestions) {
                    assignment.setFinalScore(autoScore);
                    assignment.setStatus(ExamAttemptStatus.FULLY_GRADED);
                } else {
                    assignment.setStatus(ExamAttemptStatus.TIMED_OUT);
                }
                assignmentRepository.save(assignment);
            } catch (Exception e) {
                log.error("Failed to auto-submit assignment {}: {}", assignment.getId(), e.getMessage());
            }
        }
    }
}
