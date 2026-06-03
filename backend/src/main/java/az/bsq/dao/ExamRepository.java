package az.bsq.dao;

import az.bsq.model.entity.Exam;
import az.bsq.model.enums.ExamStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    Page<Exam> findBySchoolId(Long schoolId, Pageable pageable);
    Page<Exam> findByCreatedByIdAndSchoolId(Long createdById, Long schoolId, Pageable pageable);
    Page<Exam> findBySchoolIdAndStatus(Long schoolId, ExamStatus status, Pageable pageable);
    boolean existsBySchoolIdAndStatusNot(Long schoolId, ExamStatus status);
    boolean existsByCreatedByIdAndStatusNot(Long createdById, ExamStatus status);
}
