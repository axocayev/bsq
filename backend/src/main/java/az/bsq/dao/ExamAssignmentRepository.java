package az.bsq.dao;

import az.bsq.model.entity.ExamAssignment;
import az.bsq.model.enums.ExamAttemptStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ExamAssignmentRepository extends JpaRepository<ExamAssignment, Long> {
    Optional<ExamAssignment> findByExamIdAndStudentId(Long examId, Long studentId);
    Page<ExamAssignment> findByStudentIdAndStatusIn(Long studentId, List<ExamAttemptStatus> statuses, Pageable pageable);
    Page<ExamAssignment> findByExamId(Long examId, Pageable pageable);

    @Query("SELECT a FROM ExamAssignment a JOIN FETCH a.exam JOIN FETCH a.student WHERE a.exam.id = :examId ORDER BY a.id")
    List<ExamAssignment> findByExamIdWithDetails(Long examId);
    boolean existsByExamIdAndStudentId(Long examId, Long studentId);
    boolean existsByExamId(Long examId);
    boolean existsByStudentIdAndStatusIn(Long studentId, List<ExamAttemptStatus> statuses);

    @Query(value = """
            SELECT ea.* FROM exam_assignments ea
            JOIN exams e ON ea.exam_id = e.id
            WHERE ea.status = 'IN_PROGRESS'
            AND ea.started_at IS NOT NULL
            AND ea.started_at + (e.duration_min * interval '1 minute') < :now
            """, nativeQuery = true)
    List<ExamAssignment> findTimedOutAssignments(LocalDateTime now);
}
