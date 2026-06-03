package az.bsq.service.impl;

import az.bsq.dao.ExamAssignmentRepository;
import az.bsq.dao.ExamQuestionRepository;
import az.bsq.dao.QuestionRepository;
import az.bsq.dao.StudentAnswerRepository;
import az.bsq.exception.BsqException;
import az.bsq.exception.ResourceNotFoundException;
import az.bsq.model.dto.request.exam_attempt.AnswerRequest;
import az.bsq.model.dto.request.exam_attempt.GradeAnswerRequest;
import az.bsq.model.dto.request.exam_attempt.SubmitExamRequest;
import az.bsq.model.dto.response.*;
import az.bsq.model.entity.*;
import az.bsq.model.enums.ExamAttemptStatus;
import az.bsq.model.enums.ExamStatus;
import az.bsq.model.enums.QuestionType;
import az.bsq.service.strategy.AnswerScoringStrategy;
import az.bsq.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamAttemptServiceImpl {

    private final ExamAssignmentRepository assignmentRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final StudentAnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final UserServiceImpl userService;
    private final List<AnswerScoringStrategy> scoringStrategies;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public Page<ExamAssignmentResponse> getMyExams(Pageable pageable) {
        Long studentId = securityUtils.getCurrentUserId();
        return assignmentRepository.findByStudentIdAndStatusIn(studentId,
                List.of(ExamAttemptStatus.values()), pageable).map(this::toAssignmentResponse);
    }

    @Transactional
    public StartExamResponse startExam(Long examId, String otpCode) {
        Long studentId = securityUtils.getCurrentUserId();
        ExamAssignment assignment = assignmentRepository.findByExamIdAndStudentId(examId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam assignment not found"));

        if (assignment.getStatus() == ExamAttemptStatus.SUBMITTED
                || assignment.getStatus() == ExamAttemptStatus.FULLY_GRADED
                || assignment.getStatus() == ExamAttemptStatus.TIMED_OUT) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_ALREADY_SUBMITTED",
                    "Exam has already been submitted");
        }
        if (assignment.getExam().getStatus() != ExamStatus.PUBLISHED) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_AVAILABLE", "Exam is not available");
        }

        // Validate OTP only when starting (not when resuming an in-progress exam)
        if (assignment.getStatus() == ExamAttemptStatus.NOT_STARTED) {
            String assignedOtp = assignment.getOtpCode();
            if (assignedOtp == null || !assignedOtp.equals(otpCode)) {
                throw new BsqException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Invalid OTP code");
            }
        }

        Exam exam = assignment.getExam();
        LocalDateTime now = LocalDateTime.now();

        if (exam.getStartDate() != null && now.isBefore(exam.getStartDate())) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_STARTED", "Exam has not started yet");
        }

        if (assignment.getStatus() == ExamAttemptStatus.NOT_STARTED) {
            assignment.setStatus(ExamAttemptStatus.IN_PROGRESS);
            assignment.setStartedAt(now);
            assignmentRepository.save(assignment);
        }
        List<ExamQuestion> examQuestions = examQuestionRepository.findByExamIdOrderByDisplayOrderAsc(exam.getId());

        List<StudentQuestionResponse> questions = examQuestions.stream().map(eq -> {
            Question q = eq.getQuestion();
            List<StudentOptionResponse> options = q.getOptions().stream()
                    .sorted(Comparator.comparingInt(QuestionOption::getDisplayOrder))
                    .map(o -> StudentOptionResponse.builder()
                            .id(o.getId()).text(o.getText()).displayOrder(o.getDisplayOrder())
                            .imageUrl(o.getImageUrl()).build())
                    .collect(Collectors.toList());

            // Always shuffle options for choice-based questions; seed by assignment+question for consistency
            if (q.getType() != QuestionType.OPEN) {
                Collections.shuffle(options, new Random(assignment.getId() * 31L + q.getId()));
            }

            return StudentQuestionResponse.builder()
                    .id(q.getId()).text(q.getText()).type(q.getType())
                    .points(eq.effectivePoints()).displayOrder(eq.getDisplayOrder())
                    .imageUrl(q.getImageUrl()).options(options).build();
        }).collect(Collectors.toList());

        if (exam.isShuffled()) Collections.shuffle(questions, new Random(assignment.getId()));

        // Each student gets the full duration from their personal start time.
        // startDate only gates when students may begin, not when the window closes.
        LocalDateTime examEndTime = assignment.getStartedAt().plusMinutes(exam.getDurationMin());

        long remainingSeconds = Math.max(0, ChronoUnit.SECONDS.between(now, examEndTime));

        long serverNowMillis = now.toInstant(java.time.ZoneOffset.UTC).toEpochMilli();
        long examEndsAtMillis = examEndTime.toInstant(java.time.ZoneOffset.UTC).toEpochMilli();

        List<DraftAnswerResponse> savedAnswers = answerRepository.findByAssignmentId(assignment.getId())
                .stream().map(a -> DraftAnswerResponse.builder()
                        .questionId(a.getQuestion().getId())
                        .answerText(a.getAnswerText())
                        .selectedOptionIds(a.getSelectedOptions().stream().map(QuestionOption::getId).toList())
                        .build())
                .toList();

        return StartExamResponse.builder()
                .assignmentId(assignment.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .durationMin(exam.getDurationMin())
                .startedAt(assignment.getStartedAt())
                .remainingSeconds(remainingSeconds)
                .serverNow(serverNowMillis)
                .examEndsAt(examEndsAtMillis)
                .questions(questions)
                .savedAnswers(savedAnswers)
                .build();
    }

    @Transactional
    public void saveAnswer(Long examId, AnswerRequest request) {
        Long studentId = securityUtils.getCurrentUserId();
        ExamAssignment assignment = assignmentRepository.findByExamIdAndStudentId(examId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam assignment not found"));

        if (assignment.getStatus() != ExamAttemptStatus.IN_PROGRESS) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_IN_PROGRESS", "Exam is not in progress");
        }

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question", request.getQuestionId()));

        StudentAnswer answer = answerRepository
                .findByAssignmentIdAndQuestionId(assignment.getId(), question.getId())
                .orElseGet(() -> StudentAnswer.builder().assignment(assignment).question(question).build());

        answer.setAnswerText(request.getAnswerText());

        if (request.getSelectedOptionIds() != null && !request.getSelectedOptionIds().isEmpty()) {
            List<QuestionOption> selected = question.getOptions().stream()
                    .filter(o -> request.getSelectedOptionIds().contains(o.getId()))
                    .collect(Collectors.toList());
            answer.setSelectedOptions(selected);
        } else if (request.getAnswerText() != null) {
            answer.setSelectedOptions(new ArrayList<>());
        }

        answerRepository.save(answer);
    }

    @Transactional
    public ExamResultResponse submitExam(Long examId, SubmitExamRequest request) {
        Long studentId = securityUtils.getCurrentUserId();
        ExamAssignment assignment = assignmentRepository.findByExamIdAndStudentId(examId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam assignment not found"));

        if (assignment.getStatus() != ExamAttemptStatus.IN_PROGRESS) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_IN_PROGRESS", "Exam is not in progress");
        }

        LocalDateTime now = LocalDateTime.now();
        Exam submittedExam = assignment.getExam();
        boolean timedOut = assignment.getStartedAt() != null &&
                now.isAfter(assignment.getStartedAt().plusMinutes(submittedExam.getDurationMin()));

        Map<Long, Question> questionMap = questionRepository.findAllById(
                request.getAnswers().stream().map(AnswerRequest::getQuestionId).toList()
        ).stream().collect(Collectors.toMap(Question::getId, q -> q));

        Map<Long, Integer> effectivePointsMap = examQuestionRepository
                .findByExamIdOrderByDisplayOrderAsc(submittedExam.getId())
                .stream().collect(Collectors.toMap(eq -> eq.getQuestion().getId(), ExamQuestion::effectivePoints));

        int autoScore = 0;
        boolean hasOpenQuestions = false;

        for (AnswerRequest ar : request.getAnswers()) {
            Question question = questionMap.get(ar.getQuestionId());
            if (question == null) continue;

            StudentAnswer studentAnswer = answerRepository
                    .findByAssignmentIdAndQuestionId(assignment.getId(), question.getId())
                    .orElseGet(() -> StudentAnswer.builder()
                            .assignment(assignment)
                            .question(question)
                            .build());

            studentAnswer.setAnswerText(ar.getAnswerText());

            if (ar.getSelectedOptionIds() != null && !ar.getSelectedOptionIds().isEmpty()) {
                List<QuestionOption> selected = question.getOptions().stream()
                        .filter(o -> ar.getSelectedOptionIds().contains(o.getId()))
                        .collect(Collectors.toList());
                studentAnswer.setSelectedOptions(selected);
            }

            int effectivePoints = effectivePointsMap.getOrDefault(question.getId(), 1);
            AnswerScoringStrategy strategy = scoringStrategies.stream()
                    .filter(s -> s.supports(question.getType()))
                    .findFirst()
                    .orElseThrow();
            strategy.score(studentAnswer, effectivePoints);
            answerRepository.save(studentAnswer);

            if (question.getType() == QuestionType.OPEN) {
                hasOpenQuestions = true;
            } else if (studentAnswer.getPointsAwarded() != null) {
                autoScore += studentAnswer.getPointsAwarded();
            }
        }

        assignment.setAutoScore(autoScore);
        assignment.setSubmittedAt(now);

        if (!hasOpenQuestions) {
            assignment.setFinalScore(autoScore);
            assignment.setStatus(ExamAttemptStatus.FULLY_GRADED);
        } else {
            assignment.setStatus(timedOut ? ExamAttemptStatus.TIMED_OUT : ExamAttemptStatus.SUBMITTED);
        }
        assignmentRepository.save(assignment);

        return buildResult(assignment);
    }

    @Transactional(readOnly = true)
    public ExamResultResponse getResult(Long examId) {
        Long studentId = securityUtils.getCurrentUserId();
        ExamAssignment assignment = assignmentRepository.findByExamIdAndStudentId(examId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam assignment not found"));

        if (assignment.getStatus() == ExamAttemptStatus.NOT_STARTED ||
                assignment.getStatus() == ExamAttemptStatus.IN_PROGRESS) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EXAM_NOT_SUBMITTED", "Exam has not been submitted yet");
        }
        return buildResult(assignment);
    }

    @Transactional(readOnly = true)
    public List<AnswerResultResponse> getAnswersForGrading(Long assignmentId) {
        ExamAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", assignmentId));
        Map<Long, Integer> epMap = buildEffectivePointsMap(assignment.getExam().getId());
        return answerRepository.findByAssignmentId(assignmentId).stream()
                .map(a -> toAnswerResult(a, epMap))
                .toList();
    }

    @Transactional
    public void gradeOpenAnswer(Long answerId, GradeAnswerRequest request) {
        StudentAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer", answerId));

        if (answer.getQuestion().getType() != QuestionType.OPEN) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "NOT_OPEN_QUESTION", "Only OPEN questions can be manually graded");
        }

        ExamAssignment assignment = answer.getAssignment();
        ExamQuestionId eqId = new ExamQuestionId(assignment.getExam().getId(), answer.getQuestion().getId());
        int effectivePoints = examQuestionRepository.findById(eqId)
                .map(ExamQuestion::effectivePoints).orElse(0);

        boolean correct = Boolean.TRUE.equals(request.getCorrect());
        User grader = userService.getActive(securityUtils.getCurrentUserId());
        answer.setCorrect(correct);
        answer.setPointsAwarded(correct ? effectivePoints : 0);
        answer.setTeacherComment(request.getComment());
        answer.setGradedBy(grader);
        answer.setGradedAt(LocalDateTime.now());
        answerRepository.save(answer);

        long ungradedCount = answerRepository.countUngradedOpenAnswers(assignment.getId());
        if (ungradedCount == 0) {
            int openScore = answerRepository.sumOpenPointsAwarded(assignment.getId());
            assignment.setFinalScore((assignment.getAutoScore() != null ? assignment.getAutoScore() : 0) + openScore);
            assignment.setStatus(ExamAttemptStatus.FULLY_GRADED);
            assignmentRepository.save(assignment);
        }
    }

    private Map<Long, Integer> buildEffectivePointsMap(Long examId) {
        return examQuestionRepository.findByExamIdOrderByDisplayOrderAsc(examId)
                .stream().collect(Collectors.toMap(eq -> eq.getQuestion().getId(), ExamQuestion::effectivePoints));
    }

    @Transactional(readOnly = true)
    public ExamResultResponse getResultByAssignmentId(Long assignmentId) {
        ExamAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", assignmentId));
        return buildResult(assignment);
    }

    private ExamResultResponse buildResult(ExamAssignment assignment) {
        List<StudentAnswer> answers = answerRepository.findByAssignmentId(assignment.getId());
        Map<Long, Integer> epMap = buildEffectivePointsMap(assignment.getExam().getId());
        int maxScore = epMap.values().stream().mapToInt(Integer::intValue).sum();

        return ExamResultResponse.builder()
                .assignmentId(assignment.getId())
                .examId(assignment.getExam().getId())
                .examTitle(assignment.getExam().getTitle())
                .status(assignment.getStatus())
                .autoScore(assignment.getAutoScore())
                .finalScore(assignment.getFinalScore())
                .maxScore(maxScore)
                .submittedAt(assignment.getSubmittedAt())
                .answers(answers.stream().map(a -> toAnswerResult(a, epMap)).toList())
                .build();
    }

    private AnswerResultResponse toAnswerResult(StudentAnswer a, Map<Long, Integer> effectivePointsMap) {
        boolean pending = a.getQuestion().getType() == QuestionType.OPEN && a.getPointsAwarded() == null;
        int maxPoints = effectivePointsMap.getOrDefault(a.getQuestion().getId(), 0);
        Set<Long> selectedIds = a.getSelectedOptions().stream().map(QuestionOption::getId).collect(Collectors.toSet());
        List<AnswerResultResponse.OptionResultResponse> options = a.getQuestion().getOptions().stream()
                .sorted(Comparator.comparingInt(QuestionOption::getDisplayOrder))
                .map(o -> AnswerResultResponse.OptionResultResponse.builder()
                        .id(o.getId()).text(o.getText()).imageUrl(o.getImageUrl())
                        .correct(o.isCorrect()).selected(selectedIds.contains(o.getId()))
                        .build())
                .toList();
        return AnswerResultResponse.builder()
                .answerId(a.getId())
                .questionId(a.getQuestion().getId())
                .questionText(a.getQuestion().getText())
                .questionImageUrl(a.getQuestion().getImageUrl())
                .questionType(a.getQuestion().getType())
                .answerText(a.getAnswerText())
                .selectedOptionIds(new ArrayList<>(selectedIds))
                .options(options)
                .correct(a.getCorrect())
                .pointsAwarded(a.getPointsAwarded())
                .maxPoints(maxPoints)
                .teacherComment(a.getTeacherComment())
                .explanation(a.getQuestion().getExplanation())
                .pendingGrade(pending)
                .build();
    }

    private ExamAssignmentResponse toAssignmentResponse(ExamAssignment a) {
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
                .build();
    }
}
