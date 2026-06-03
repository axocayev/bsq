package az.bsq.service.impl;

import az.bsq.dao.ExamAssignmentRepository;
import az.bsq.dao.ExamRepository;
import az.bsq.dao.QuestionRepository;
import az.bsq.dao.UserRepository;
import az.bsq.exception.BsqException;
import az.bsq.exception.ResourceNotFoundException;
import az.bsq.model.dto.request.user.ChangePasswordRequest;
import az.bsq.model.dto.request.user.CreateUserRequest;
import az.bsq.model.dto.request.user.ResetPasswordRequest;
import az.bsq.model.dto.request.user.UpdateProfileRequest;
import az.bsq.model.dto.request.user.UpdateUserRequest;
import az.bsq.model.dto.response.UserResponse;
import az.bsq.model.entity.School;
import az.bsq.model.entity.User;
import az.bsq.model.enums.ExamAttemptStatus;
import az.bsq.model.enums.ExamStatus;
import az.bsq.model.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl {

    private final UserRepository userRepository;
    private final SchoolServiceImpl schoolService;
    private final PasswordEncoder passwordEncoder;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final ExamAssignmentRepository assignmentRepository;

    @Transactional(readOnly = true)
    public Page<UserResponse> findAll(Pageable pageable) {
        return userRepository.findByActiveTrue(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> findBySchool(Long schoolId, Pageable pageable) {
        return userRepository.findBySchoolIdAndActiveTrue(schoolId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> findBySchoolAndRole(Long schoolId, Role role, Pageable pageable) {
        return userRepository.findBySchoolIdAndRoleAndActiveTrue(schoolId, role, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return toResponse(getActive(id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BsqException(HttpStatus.CONFLICT, "USERNAME_EXISTS", "Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BsqException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email already registered");
        }

        School school = null;
        if (request.getRole() != Role.ADMIN) {
            if (request.getSchoolId() == null) {
                throw new BsqException(HttpStatus.BAD_REQUEST, "SCHOOL_REQUIRED", "School is required for this role");
            }
            school = schoolService.getActive(request.getSchoolId());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(request.getRole())
                .school(school)
                .build();
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = getActive(id);
        if (StringUtils.hasText(request.getFullName())) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (StringUtils.hasText(request.getEmail())) {
            if (!request.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
                throw new BsqException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email already in use");
            }
            user.setEmail(request.getEmail());
        }
        if (StringUtils.hasText(request.getPassword())) user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        return toResponse(userRepository.save(user));
    }

    private static final List<ExamAttemptStatus> ACTIVE_ATTEMPT_STATUSES = List.of(
            ExamAttemptStatus.NOT_STARTED,
            ExamAttemptStatus.IN_PROGRESS,
            ExamAttemptStatus.SUBMITTED
    );

    @Transactional
    public void deactivate(Long id) {
        User user = getActive(id);
        if (questionRepository.existsByCreatedByIdAndActiveTrue(id)) {
            throw new BsqException(HttpStatus.CONFLICT, "USER_HAS_QUESTIONS",
                    "Cannot deactivate user who has active questions");
        }
        if (examRepository.existsByCreatedByIdAndStatusNot(id, ExamStatus.ARCHIVED)) {
            throw new BsqException(HttpStatus.CONFLICT, "USER_HAS_EXAMS",
                    "Cannot deactivate user who has active exams");
        }
        if (assignmentRepository.existsByStudentIdAndStatusIn(id, ACTIVE_ATTEMPT_STATUSES)) {
            throw new BsqException(HttpStatus.CONFLICT, "USER_HAS_ACTIVE_ASSIGNMENTS",
                    "Cannot deactivate student with ongoing exam assignments");
        }
        user.setActive(false);
        userRepository.save(user);
    }

    public User getActive(Long id) {
        return userRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getActive(userId);
        if (StringUtils.hasText(request.getFullName())) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (StringUtils.hasText(request.getEmail())) {
            if (!request.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
                throw new BsqException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email already in use");
            }
            user.setEmail(request.getEmail());
        }
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void resetPassword(Long userId, ResetPasswordRequest request) {
        User user = getActive(userId);
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getActive(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "WRONG_PASSWORD", "Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .role(u.getRole())
                .schoolId(u.getSchool() != null ? u.getSchool().getId() : null)
                .schoolName(u.getSchool() != null ? u.getSchool().getName() : null)
                .active(u.isActive())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
