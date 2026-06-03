package az.bsq.service.impl;

import az.bsq.dao.QuestionRepository;
import az.bsq.dao.SubjectRepository;
import az.bsq.exception.BsqException;
import az.bsq.exception.ResourceNotFoundException;
import az.bsq.model.dto.request.subject.CreateSubjectRequest;
import az.bsq.model.dto.response.SubjectResponse;
import az.bsq.model.entity.Subject;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl {

    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;

    @Transactional(readOnly = true)
    public List<SubjectResponse> findAll() {
        return subjectRepository.findByActiveTrueOrderByNameAsc()
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public SubjectResponse create(CreateSubjectRequest request) {
        Subject subject = Subject.builder().name(request.getName()).build();
        return toResponse(subjectRepository.save(subject));
    }

    @Transactional
    public SubjectResponse update(Long id, CreateSubjectRequest request) {
        Subject subject = getActive(id);
        if (isInUse(id)) {
            throw new BsqException(HttpStatus.CONFLICT, "SUBJECT_IN_USE",
                    "Cannot edit a subject that is assigned to questions");
        }
        subject.setName(request.getName());
        return toResponse(subjectRepository.save(subject));
    }

    @Transactional
    public void delete(Long id) {
        Subject subject = getActive(id);
        if (isInUse(id)) {
            throw new BsqException(HttpStatus.CONFLICT, "SUBJECT_IN_USE",
                    "Cannot delete a subject that is assigned to questions");
        }
        subject.setActive(false);
        subjectRepository.save(subject);
    }

    public Subject getActive(Long id) {
        return subjectRepository.findById(id)
                .filter(Subject::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", id));
    }

    private boolean isInUse(Long subjectId) {
        return questionRepository.existsBySubjectIdAndActiveTrue(subjectId);
    }

    public SubjectResponse toResponse(Subject s) {
        return SubjectResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .inUse(isInUse(s.getId()))
                .createdAt(s.getCreatedAt())
                .build();
    }
}
