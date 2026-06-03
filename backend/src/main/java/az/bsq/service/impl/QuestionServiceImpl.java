package az.bsq.service.impl;

import az.bsq.dao.ExamQuestionRepository;
import az.bsq.dao.QuestionRepository;
import az.bsq.exception.BsqException;
import az.bsq.exception.ResourceNotFoundException;
import az.bsq.model.dto.request.question.CreateQuestionRequest;
import az.bsq.model.dto.response.QuestionOptionResponse;
import az.bsq.model.dto.response.QuestionResponse;
import az.bsq.model.entity.Question;
import az.bsq.model.entity.QuestionOption;
import az.bsq.model.entity.School;
import az.bsq.model.entity.User;
import az.bsq.model.enums.QuestionType;
import az.bsq.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl {

    private final QuestionRepository questionRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final SubjectServiceImpl subjectService;
    private final UserServiceImpl userService;
    private final SchoolServiceImpl schoolService;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public Page<QuestionResponse> findBySchool(Long schoolId, Pageable pageable) {
        return questionRepository.findBySchoolIdAndActiveTrue(schoolId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponse> findMyQuestions(Pageable pageable) {
        Long teacherId = securityUtils.getCurrentUserId();
        return questionRepository.findByCreatedByIdAndActiveTrue(teacherId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponse> findMyQuestions(String search, Pageable pageable) {
        Long teacherId = securityUtils.getCurrentUserId();
        if (search == null || search.isBlank()) {
            return questionRepository.findByCreatedByIdAndActiveTrue(teacherId, pageable).map(this::toResponse);
        }
        return questionRepository.findByCreatedByIdAndActiveTrueAndTextContainingIgnoreCase(teacherId, search, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public QuestionResponse findById(Long id) {
        return toResponse(getActive(id));
    }

    @Transactional
    public QuestionResponse create(CreateQuestionRequest request) {
        Long schoolId = securityUtils.getCurrentUserSchoolId();
        User teacher = userService.getActive(securityUtils.getCurrentUserId());
        School school = schoolService.getActive(schoolId);

        if (request.getType() != QuestionType.OPEN && (request.getOptions() == null || request.getOptions().isEmpty())) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "OPTIONS_REQUIRED", "Non-OPEN questions require options");
        }

        az.bsq.model.entity.Subject subject = request.getSubjectId() != null
                ? subjectService.getActive(request.getSubjectId()) : null;

        Question question = Question.builder()
                .text(request.getText())
                .type(request.getType())
                .subject(subject)
                .explanation(request.getExplanation())
                .imageUrl(request.getImageUrl())
                .createdBy(teacher)
                .school(school)
                .build();

        if (request.getOptions() != null) {
            List<QuestionOption> options = new ArrayList<>();
            request.getOptions().forEach(o -> {
                QuestionOption opt = QuestionOption.builder()
                        .question(question)
                        .text(o.getText())
                        .correct(o.isCorrect())
                        .displayOrder(o.getDisplayOrder())
                        .imageUrl(o.getImageUrl())
                        .build();
                options.add(opt);
            });
            question.setOptions(options);
        }

        return toResponse(questionRepository.save(question));
    }

    @Transactional
    public QuestionResponse update(Long id, CreateQuestionRequest request) {
        Question question = getActive(id);
        if (examQuestionRepository.existsByQuestionId(id)) {
            throw new BsqException(HttpStatus.CONFLICT, "QUESTION_IN_USE",
                    "Cannot edit a question that is currently used in an exam");
        }
        question.setText(request.getText());
        question.setType(request.getType());
        question.setExplanation(request.getExplanation());
        question.setImageUrl(request.getImageUrl());
        question.setSubject(request.getSubjectId() != null ? subjectService.getActive(request.getSubjectId()) : null);

        question.getOptions().clear();
        if (request.getOptions() != null) {
            int order = 0;
            for (var o : request.getOptions()) {
                question.getOptions().add(QuestionOption.builder()
                        .question(question).text(o.getText()).correct(o.isCorrect())
                        .displayOrder(order++).imageUrl(o.getImageUrl()).build());
            }
        }
        return toResponse(questionRepository.save(question));
    }

    @Transactional
    public void delete(Long id) {
        Question question = getActive(id);
        if (examQuestionRepository.existsByQuestionId(id)) {
            throw new BsqException(HttpStatus.CONFLICT, "QUESTION_IN_USE",
                    "Cannot delete a question that is currently used in an exam");
        }
        question.setActive(false);
        questionRepository.save(question);
    }

    public Question getActive(Long id) {
        return questionRepository.findById(id)
                .filter(Question::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));
    }

    public QuestionResponse toResponse(Question q) {
        return QuestionResponse.builder()
                .id(q.getId())
                .text(q.getText())
                .type(q.getType())
                .explanation(q.getExplanation())
                .imageUrl(q.getImageUrl())
                .options(q.getOptions().stream().map(o -> QuestionOptionResponse.builder()
                        .id(o.getId())
                        .text(o.getText())
                        .correct(o.isCorrect())
                        .displayOrder(o.getDisplayOrder())
                        .imageUrl(o.getImageUrl())
                        .build()).toList())
                .createdById(q.getCreatedBy().getId())
                .createdByName(q.getCreatedBy().getFullName())
                .subjectId(q.getSubject() != null ? q.getSubject().getId() : null)
                .subjectName(q.getSubject() != null ? q.getSubject().getName() : null)
                .inUse(examQuestionRepository.existsByQuestionId(q.getId()))
                .createdAt(q.getCreatedAt())
                .build();
    }
}
