package az.bsq.dao;

import az.bsq.model.entity.User;
import az.bsq.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsernameAndActiveTrue(String username);
    Optional<User> findByIdAndActiveTrue(Long id);
    Optional<User> findByEmailAndActiveTrue(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsBySchoolIdAndActiveTrue(Long schoolId);
    Page<User> findByActiveTrue(Pageable pageable);
    Page<User> findBySchoolIdAndRoleAndActiveTrue(Long schoolId, Role role, Pageable pageable);
    Page<User> findBySchoolIdAndActiveTrue(Long schoolId, Pageable pageable);
    Page<User> findByRoleAndActiveTrue(Role role, Pageable pageable);
}
