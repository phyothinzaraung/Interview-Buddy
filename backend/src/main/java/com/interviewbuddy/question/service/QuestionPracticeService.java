package com.interviewbuddy.question.service;

import com.interviewbuddy.question.dto.PracticeAnswerRequest;
import com.interviewbuddy.question.dto.PracticeAnswerResponse;
import com.interviewbuddy.question.dto.PracticeProgressResponse;
import com.interviewbuddy.question.dto.InterviewPracticeResponse;
import com.interviewbuddy.question.service.QuestionGenerationService;
import com.interviewbuddy.session.dto.InterviewSessionResponse;
import com.interviewbuddy.question.exception.QuestionNotFoundException;
import com.interviewbuddy.question.model.InterviewQuestion;
import com.interviewbuddy.question.model.QuestionPracticeAnswer;
import com.interviewbuddy.question.repository.InterviewQuestionRepository;
import com.interviewbuddy.question.repository.QuestionPracticeAnswerRepository;
import com.interviewbuddy.session.exception.InterviewSessionNotFoundException;
import com.interviewbuddy.session.model.InterviewSession;
import com.interviewbuddy.session.model.InterviewStatus;
import com.interviewbuddy.session.repository.InterviewSessionRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestionPracticeService {
    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final QuestionPracticeAnswerRepository answerRepository;
    private final QuestionGenerationService generationService;

    public QuestionPracticeService(InterviewSessionRepository sessionRepository,
            InterviewQuestionRepository questionRepository, QuestionPracticeAnswerRepository answerRepository,
            QuestionGenerationService generationService) {
        this.sessionRepository = sessionRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.generationService = generationService;
    }

    @Transactional(readOnly = true)
    public PracticeAnswerResponse getAnswer(Long sessionId, Long questionId, Long ownerId) {
        InterviewQuestion question = ownedQuestion(sessionId, questionId, ownerId);
        QuestionPracticeAnswer answer = question.getPracticeAnswer();
        return toResponse(questionId, answer);
    }

    @Transactional
    public PracticeAnswerResponse saveAnswer(Long sessionId, Long questionId, Long ownerId,
            PracticeAnswerRequest request) {
        InterviewQuestion question = ownedQuestion(sessionId, questionId, ownerId);
        QuestionPracticeAnswer answer = question.getPracticeAnswer();
        if (answer == null) {
            answer = new QuestionPracticeAnswer(question);
            question.setPracticeAnswer(answer);
        }
        answer.updateAnswer(request.answerText().trim());
        answerRepository.save(answer);
        refreshStatus(sessionId, ownerId);
        return toResponse(questionId, answer);
    }

    @Transactional
    public PracticeAnswerResponse markCompleted(Long sessionId, Long questionId, Long ownerId) {
        InterviewQuestion question = ownedQuestion(sessionId, questionId, ownerId);
        QuestionPracticeAnswer answer = question.getPracticeAnswer();
        if (answer == null) {
            answer = new QuestionPracticeAnswer(question);
            question.setPracticeAnswer(answer);
        }
        answer.markCompleted();
        answerRepository.save(answer);
        refreshStatus(sessionId, ownerId);
        return toResponse(questionId, answer);
    }

    @Transactional(readOnly = true)
    public PracticeProgressResponse getProgress(Long sessionId, Long ownerId) {
        InterviewSession session = ownedSession(sessionId, ownerId);
        return progress(session, false);
    }

    @Transactional(readOnly = true)
    public InterviewPracticeResponse getPracticeSession(Long sessionId, Long ownerId) {
        InterviewSession session = ownedSession(sessionId, ownerId);
        InterviewSessionResponse sessionResponse = new InterviewSessionResponse(session.getId(), session.getRole(),
                session.getDifficulty(), session.getInterviewType(), session.getTopic(), session.getStatus(),
                session.getCreatedAt());
        return new InterviewPracticeResponse(sessionResponse, generationService.getQuestions(sessionId, ownerId),
                progress(session, false));
    }

    private void refreshStatus(Long sessionId, Long ownerId) {
        InterviewSession session = ownedSession(sessionId, ownerId);
        progress(session, true);
    }

    private PracticeProgressResponse progress(InterviewSession session, boolean updateStatus) {
        List<InterviewQuestion> questions = questionRepository
                .findAllByInterviewSession_IdOrderByQuestionOrderAsc(session.getId());
        long total = questions.size();
        long answered = questions.stream().filter(q -> q.getPracticeAnswer() != null
                && q.getPracticeAnswer().getAnswerText() != null).count();
        long completed = questions.stream().filter(q -> q.getPracticeAnswer() != null
                && q.getPracticeAnswer().getCompletedAt() != null).count();
        InterviewStatus status;
        if (total == 0) status = InterviewStatus.CREATED;
        else if (completed == total) status = InterviewStatus.COMPLETED;
        else if (answered > 0 || completed > 0) status = InterviewStatus.IN_PROGRESS;
        else status = InterviewStatus.QUESTIONS_GENERATED;
        if (updateStatus) session.setStatus(status);
        int percent = total == 0 ? 0 : (int) ((completed * 100) / total);
        return new PracticeProgressResponse(status, total, answered, completed, percent);
    }

    private InterviewSession ownedSession(Long sessionId, Long ownerId) {
        return sessionRepository.findByIdAndOwner_Id(sessionId, ownerId)
                .orElseThrow(() -> new InterviewSessionNotFoundException(sessionId));
    }

    private InterviewQuestion ownedQuestion(Long sessionId, Long questionId, Long ownerId) {
        return questionRepository.findOwnedQuestion(questionId, sessionId, ownerId)
                .orElseThrow(() -> new QuestionNotFoundException(questionId));
    }

    private PracticeAnswerResponse toResponse(Long questionId, QuestionPracticeAnswer answer) {
        return new PracticeAnswerResponse(questionId, answer == null ? null : answer.getAnswerText(),
                answer == null ? null : answer.getUpdatedAt(), answer == null ? null : answer.getCompletedAt());
    }
}
