package az.bsq.dao;

import az.bsq.model.entity.Question;
import az.bsq.model.enums.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    Page<Question> findBySchoolIdAndActiveTrue(Long schoolId, Pageable pageable);
    Page<Question> findByCreatedByIdAndActiveTrue(Long createdById, Pageable pageable);
    Page<Question> findByCreatedByIdAndActiveTrueAndTextContainingIgnoreCase(Long createdById, String text, Pageable pageable);
    boolean existsBySubjectIdAndActiveTrue(Long subjectId);
    Page<Question> findBySchoolIdAndTypeAndActiveTrue(Long schoolId, QuestionType type, Pageable pageable);
    boolean existsBySchoolIdAndActiveTrue(Long schoolId);
    boolean existsByCreatedByIdAndActiveTrue(Long createdById);
}
