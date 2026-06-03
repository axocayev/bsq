package az.bsq.dao;

import az.bsq.model.entity.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {
    List<StudentAnswer> findByAssignmentId(Long assignmentId);
    Optional<StudentAnswer> findByAssignmentIdAndQuestionId(Long assignmentId, Long questionId);

    @Query("SELECT COUNT(a) FROM StudentAnswer a WHERE a.assignment.id = :assignmentId AND a.question.type = 'OPEN' AND a.pointsAwarded IS NULL")
    long countUngradedOpenAnswers(Long assignmentId);

    @Query("SELECT COALESCE(SUM(a.pointsAwarded), 0) FROM StudentAnswer a WHERE a.assignment.id = :assignmentId AND a.question.type = 'OPEN'")
    int sumOpenPointsAwarded(Long assignmentId);
}
