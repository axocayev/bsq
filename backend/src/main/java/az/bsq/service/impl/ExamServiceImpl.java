package az.bsq.service.impl;

import az.bsq.dao.ExamAssignmentRepository;
import az.bsq.dao.ExamQuestionRepository;
import az.bsq.dao.ExamRepository;
import az.bsq.dao.UserRepository;
import az.bsq.exception.BsqException;
import az.bsq.exception.ResourceNotFoundException;
import az.bsq.model.dto.request.exam.AddQuestionsRequest;
import az.bsq.model.dto.request.exam.AssignStudentsRequest;
import az.bsq.model.dto.request.exam.CreateExamRequest;
import az.bsq.model.dto.request.exam.RejectExamRequest;
import az.bsq.model.dto.request.exam.UpdateQuestionPointsRequest;
import az.bsq.model.dto.response.ExamAssignmentResponse;
import az.bsq.model.dto.response.ExamResponse;
import az.bsq.model.dto.response.QuestionOptionResponse;
import az.bsq.model.dto.response.QuestionResponse;
import az.bsq.model.entity.*;
import az.bsq.model.enums.ExamAttemptStatus;
import az.bsq.model.enums.ExamStatus;
import az.bsq.model.enums.Role;
import az.bsq.service.OtpService;
import az.bsq.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamServiceImpl {

    private final ExamRepository examRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final ExamAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final QuestionServiceImpl questionService;
    private final SchoolServiceImpl schoolService;
    private final UserServiceImpl userService;
    private final OtpService otpService;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public Page<ExamResponse> findMyExams(Pageable pageable) {
        Long teacherId = securityUtils.getCurrentUserId();
        Long schoolId = securityUtils.getCurrentUserSchoolId();
        return examRepository.findByCreatedByIdAndSchoolId(teacherId, schoolId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ExamResponse> findBySchool(Long schoolId, Pageable pageable) {
        return examRepository.findBySchoolId(schoolId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ExamResponse> findAll(Pageable pageable) {
        return examRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ExamResponse findById(Long id) {
        return toResponse(getExam(id));
    }

    @Transactional
    public ExamResponse create(CreateExamRequest request) {
        Long schoolId = securityUtils.getCurrentUserSchoolId();
        User teacher = userService.getActive(securityUtils.getCurrentUserId());
        School school = schoolService.getActive(schoolId);

        Exam exam = Exam.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .durationMin(request.getDurationMin())
                .school(school)
                .createdBy(teacher)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .shuffled(request.isShuffled())
                .build();
        return toResponse(examRepository.save(exam));
    }

    @Transactional
    public ExamResponse update(Long id, CreateExamRequest request) {
        Exam exam = getExam(id);
        validateEditableByTeacher(exam);
        return applyUpdate(exam, request);
    }

    @Transactional
    public ExamResponse adminUpdate(Long id, CreateExamRequest request) {
        return applyUpdate(getExam(id), request);
    }

    private void validateEditableByTeacher(Exam exam) {
        boolean isDraft = exam.getStatus() == ExamStatus.DRAFT || exam.getStatus() == ExamStatus.REJECTED;
        boolean isBeforeStart = exam.getStartDate() != null && LocalDateTime.now().isBefore(exam.getStartDate());

        if (!isDraft && !isBeforeStart) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_EDITABLE", "Exam cannot be edited at this stage");
        }
    }

    private ExamResponse applyUpdate(Exam exam, CreateExamRequest request) {
        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setDurationMin(request.getDurationMin());
        exam.setStartDate(request.getStartDate());
        exam.setEndDate(request.getEndDate());
        exam.setShuffled(request.isShuffled());
        return toResponse(examRepository.save(exam));
    }

    @Transactional
    public void addQuestions(Long examId, AddQuestionsRequest request) {
        Exam exam = getExam(examId);
        validateEditable(exam);
        int order = exam.getExamQuestions().size();
        for (Long qId : request.getQuestionIds()) {
            Question question = questionService.getActive(qId);
            if (!question.getSchool().getId().equals(exam.getSchool().getId())) {
                throw new BsqException(HttpStatus.BAD_REQUEST, "SCHOOL_MISMATCH", "Question belongs to a different school");
            }
            ExamQuestionId compositeId = new ExamQuestionId(examId, qId);
            if (!examQuestionRepository.existsById(compositeId)) {
                examQuestionRepository.save(ExamQuestion.builder()
                        .id(compositeId)
                        .exam(exam)
                        .question(question)
                        .displayOrder(order++)
                        .pointsOverride(1)
                        .build());
            }
        }
    }

    @Transactional
    public void removeQuestion(Long examId, Long questionId) {
        validateEditable(getExam(examId));
        examQuestionRepository.deleteByExamIdAndQuestionId(examId, questionId);
    }

    @Transactional
    public void updateQuestionPoints(Long examId, Long questionId, UpdateQuestionPointsRequest request) {
        validateEditable(getExam(examId));
        ExamQuestionId compositeId = new ExamQuestionId(examId, questionId);
        ExamQuestion eq = examQuestionRepository.findById(compositeId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamQuestion", questionId));
        eq.setPointsOverride(request.getPoints() != null ? request.getPoints() : 1);
        examQuestionRepository.save(eq);
    }

    @Transactional
    public ExamResponse submitForApproval(Long id) {
        Exam exam = getExam(id);
        validateEditableForSubmission(exam);
        validateHasQuestions(exam);
        validateHasAssignments(id);
        exam.setStatus(ExamStatus.PENDING_APPROVAL);
        exam.setApprovalNote(null);
        return toResponse(examRepository.save(exam));
    }

    @Transactional
    public ExamResponse approve(Long id) {
        Exam exam = getExam(id);
        validatePendingApproval(exam);
        exam.setStatus(ExamStatus.PUBLISHED);
        exam.setApprovalNote(null);
        return toResponse(examRepository.save(exam));
    }

    @Transactional
    public ExamResponse reject(Long id, RejectExamRequest request) {
        Exam exam = getExam(id);
        validatePendingApproval(exam);
        exam.setStatus(ExamStatus.REJECTED);
        exam.setApprovalNote(request.getReason());
        return toResponse(examRepository.save(exam));
    }

    @Transactional
    public ExamResponse publish(Long id) {
        Exam exam = getExam(id);
        validateApproved(exam);
        exam.setStatus(ExamStatus.PUBLISHED);
        return toResponse(examRepository.save(exam));
    }

    @Transactional
    public ExamResponse close(Long id) {
        Exam exam = getExam(id);
        validatePublished(exam);
        exam.setStatus(ExamStatus.CLOSED);
        return toResponse(examRepository.save(exam));
    }

    private void validateEditableForSubmission(Exam exam) {
        boolean isEditable = exam.getStatus() == ExamStatus.DRAFT || exam.getStatus() == ExamStatus.REJECTED;
        if (!isEditable) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_EDITABLE", "Only DRAFT or REJECTED exams can be submitted for approval");
        }
    }

    private void validateHasQuestions(Exam exam) {
        if (exam.getExamQuestions().isEmpty()) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "NO_QUESTIONS", "Add at least one question before submitting for approval");
        }
    }

    private void validateHasAssignments(Long examId) {
        if (!assignmentRepository.existsByExamId(examId)) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "NO_STUDENTS", "Assign at least one student before submitting for approval");
        }
    }

    private void validatePendingApproval(Exam exam) {
        if (exam.getStatus() != ExamStatus.PENDING_APPROVAL) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_PENDING", "Only PENDING_APPROVAL exams can be approved or rejected");
        }
    }

    private void validateApproved(Exam exam) {
        if (exam.getStatus() != ExamStatus.APPROVED) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_APPROVED", "Exam must be APPROVED before publishing");
        }
    }

    private void validatePublished(Exam exam) {
        if (exam.getStatus() != ExamStatus.PUBLISHED) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_PUBLISHED", "Only PUBLISHED exams can be closed");
        }
    }

    @Transactional
    public List<ExamAssignmentResponse> assignStudents(Long examId, AssignStudentsRequest request) {
        Exam exam = getExam(examId);
        validateExamAssignable(exam);
        User teacher = userService.getActive(securityUtils.getCurrentUserId());

        return request.getStudentIds().stream()
                .filter(studentId -> !isAlreadyAssigned(examId, studentId))
                .map(studentId -> createAssignment(exam, studentId, request.getDeadline(), teacher))
                .toList();
    }

    private void validateExamAssignable(Exam exam) {
        if (exam.getStatus() == ExamStatus.CLOSED || exam.getStatus() == ExamStatus.ARCHIVED) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_ASSIGNABLE", "Cannot assign students to a closed or archived exam");
        }
    }

    private boolean isAlreadyAssigned(Long examId, Long studentId) {
        return assignmentRepository.existsByExamIdAndStudentId(examId, studentId);
    }

    private ExamAssignmentResponse createAssignment(Exam exam, Long studentId, LocalDateTime deadline, User teacher) {
        User student = validateAndGetStudent(studentId, exam);
        String otp = otpService.generateOtp();
        ExamAssignment assignment = buildAssignment(exam, student, teacher, deadline, otp);
        return toAssignmentResponse(assignmentRepository.save(assignment));
    }

    private User validateAndGetStudent(Long studentId, Exam exam) {
        return userRepository.findByIdAndActiveTrue(studentId)
                .filter(u -> u.getRole() == Role.STUDENT && u.getSchool() != null
                        && u.getSchool().getId().equals(exam.getSchool().getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
    }

    private ExamAssignment buildAssignment(Exam exam, User student, User teacher, LocalDateTime deadline, String otp) {
        return ExamAssignment.builder()
                .exam(exam)
                .student(student)
                .assignedBy(teacher)
                .deadline(deadline)
                .otpCode(otp)
                .build();
    }

    @Transactional
    public void delete(Long id) {
        Exam exam = getExam(id);
        validateEditable(exam);
        exam.setStatus(ExamStatus.ARCHIVED);
        examRepository.save(exam);
    }

    public Exam getExam(Long id) {
        return examRepository.findById(id)
                .filter(e -> e.getStatus() != ExamStatus.ARCHIVED)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", id));
    }

    private void validateEditable(Exam exam) {
        if (exam.getStatus() != ExamStatus.DRAFT && exam.getStatus() != ExamStatus.REJECTED) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_EDITABLE", "Exam can only be edited in DRAFT or REJECTED status");
        }
    }

    public ExamResponse toResponse(Exam e) {
        return ExamResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .description(e.getDescription())
                .durationMin(e.getDurationMin())
                .status(e.getStatus())
                .schoolId(e.getSchool().getId())
                .schoolName(e.getSchool().getName())
                .createdById(e.getCreatedBy().getId())
                .createdByName(e.getCreatedBy().getFullName())
                .startDate(e.getStartDate())
                .endDate(e.getEndDate())
                .shuffled(e.isShuffled())
                .questionCount(e.getExamQuestions().size())
                .approvalNote(e.getApprovalNote())
                .createdAt(e.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> getExamQuestions(Long examId) {
        getExam(examId);
        return examQuestionRepository.findByExamIdWithQuestion(examId).stream().map(eq -> {
            Question q = eq.getQuestion();
            return QuestionResponse.builder()
                    .id(q.getId())
                    .text(q.getText())
                    .type(q.getType())
                    .points(eq.effectivePoints())
                    .explanation(q.getExplanation())
                    .imageUrl(q.getImageUrl())
                    .createdAt(q.getCreatedAt())
                    .options(q.getOptions().stream()
                            .sorted(java.util.Comparator.comparingInt(QuestionOption::getDisplayOrder))
                            .map(o -> QuestionOptionResponse.builder()
                                    .id(o.getId()).text(o.getText())
                                    .correct(o.isCorrect()).displayOrder(o.getDisplayOrder()).build())
                            .toList())
                    .build();
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<ExamAssignmentResponse> getExamAssignments(Long examId) {
        getExam(examId);
        return assignmentRepository.findByExamIdWithDetails(examId)
                .stream().map(this::toAssignmentResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ExamAssignmentResponse> getExamAssignmentsWithOtp(Long examId) {
        getExam(examId);
        return assignmentRepository.findByExamIdWithDetails(examId)
                .stream().map(this::toAssignmentResponseWithOtp).toList();
    }

    @Transactional
    public void removeAssignment(Long assignmentId) {
        ExamAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", assignmentId));
        if (assignment.getStatus() != ExamAttemptStatus.NOT_STARTED) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "ASSIGNMENT_STARTED",
                    "Cannot remove a student who has already started or submitted the exam");
        }
        assignmentRepository.deleteById(assignmentId);
    }

    @Transactional
    public ExamResponse changeStartTime(Long examId, LocalDateTime newStartDate) {
        Exam exam = getExam(examId);
        exam.setStartDate(newStartDate);
        return toResponse(examRepository.save(exam));
    }

    private ExamAssignmentResponse toAssignmentResponse(ExamAssignment a) {
        return buildAssignmentResponse(a, false);
    }

    private ExamAssignmentResponse toAssignmentResponseWithOtp(ExamAssignment a) {
        return buildAssignmentResponse(a, true);
    }

    private ExamAssignmentResponse buildAssignmentResponse(ExamAssignment a, boolean includeOtp) {
        return ExamAssignmentResponse.builder()
                .id(a.getId())
                .examId(a.getExam().getId())
                .examTitle(a.getExam().getTitle())
                .durationMin(a.getExam().getDurationMin())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getFullName())
                .status(a.getStatus())
                .startedAt(a.getStartedAt())
                .submittedAt(a.getSubmittedAt())
                .deadline(a.getDeadline())
                .autoScore(a.getAutoScore())
                .finalScore(a.getFinalScore())
                .assignedAt(a.getCreatedAt())
                .otpCode(includeOtp ? a.getOtpCode() : null)
                .build();
    }
}
