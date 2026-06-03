package az.bsq.dao;

import az.bsq.model.entity.ExamQuestion;
import az.bsq.model.entity.ExamQuestionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, ExamQuestionId> {
    List<ExamQuestion> findByExamIdOrderByDisplayOrderAsc(Long examId);
    void deleteByExamIdAndQuestionId(Long examId, Long questionId);
    boolean existsByQuestionId(Long questionId);

    @Query("SELECT eq FROM ExamQuestion eq JOIN FETCH eq.question q LEFT JOIN FETCH q.options WHERE eq.exam.id = :examId ORDER BY eq.displayOrder")
    List<ExamQuestion> findByExamIdWithQuestion(Long examId);
}
