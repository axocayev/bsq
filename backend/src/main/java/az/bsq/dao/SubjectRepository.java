package az.bsq.dao;

import az.bsq.model.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByActiveTrueOrderByNameAsc();
}
