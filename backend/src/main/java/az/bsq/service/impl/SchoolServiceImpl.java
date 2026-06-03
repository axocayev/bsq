package az.bsq.service.impl;

import az.bsq.dao.ExamRepository;
import az.bsq.dao.QuestionRepository;
import az.bsq.dao.SchoolRepository;
import az.bsq.dao.UserRepository;
import az.bsq.exception.BsqException;
import az.bsq.exception.ResourceNotFoundException;
import az.bsq.model.dto.request.school.CreateSchoolRequest;
import az.bsq.model.dto.response.SchoolResponse;
import az.bsq.model.entity.School;
import az.bsq.model.enums.ExamStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SchoolServiceImpl {

    private final SchoolRepository schoolRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;

    @Transactional(readOnly = true)
    public Page<SchoolResponse> findAll(Pageable pageable) {
        return schoolRepository.findByActiveTrue(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public SchoolResponse findById(Long id) {
        return toResponse(getActive(id));
    }

    @Transactional
    public SchoolResponse create(CreateSchoolRequest request) {
        if (request.getCode() != null && schoolRepository.existsByCode(request.getCode())) {
            throw new BsqException(HttpStatus.CONFLICT, "SCHOOL_CODE_EXISTS", "School code already in use");
        }
        School school = School.builder()
                .name(request.getName())
                .code(request.getCode())
                .build();
        return toResponse(schoolRepository.save(school));
    }

    @Transactional
    public SchoolResponse update(Long id, CreateSchoolRequest request) {
        School school = getActive(id);
        school.setName(request.getName());
        if (request.getCode() != null) school.setCode(request.getCode());
        return toResponse(schoolRepository.save(school));
    }

    @Transactional
    public void delete(Long id) {
        School school = getActive(id);
        if (userRepository.existsBySchoolIdAndActiveTrue(id)) {
            throw new BsqException(HttpStatus.CONFLICT, "SCHOOL_HAS_USERS",
                    "Cannot delete school that has active users");
        }
        if (questionRepository.existsBySchoolIdAndActiveTrue(id)) {
            throw new BsqException(HttpStatus.CONFLICT, "SCHOOL_HAS_QUESTIONS",
                    "Cannot delete school that has active questions");
        }
        if (examRepository.existsBySchoolIdAndStatusNot(id, ExamStatus.ARCHIVED)) {
            throw new BsqException(HttpStatus.CONFLICT, "SCHOOL_HAS_EXAMS",
                    "Cannot delete school that has active exams");
        }
        school.setActive(false);
        schoolRepository.save(school);
    }

    public School getActive(Long id) {
        return schoolRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("School", id));
    }

    private SchoolResponse toResponse(School s) {
        return SchoolResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .code(s.getCode())
                .active(s.isActive())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
