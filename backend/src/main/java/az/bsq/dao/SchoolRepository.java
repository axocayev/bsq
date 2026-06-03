package az.bsq.dao;

import az.bsq.model.entity.School;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SchoolRepository extends JpaRepository<School, Long> {
    Optional<School> findByIdAndActiveTrue(Long id);
    Page<School> findByActiveTrue(Pageable pageable);
    boolean existsByCode(String code);
}
