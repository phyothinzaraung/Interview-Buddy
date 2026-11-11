package com.interviewbuddy.question.service;

import com.interviewbuddy.ai.dto.AiGeneratedQuestion;
import com.interviewbuddy.ai.dto.AiGeneratedQuestions;
import com.interviewbuddy.ai.exception.AiServiceException;
import com.interviewbuddy.ai.service.AiService;
import com.interviewbuddy.ai.service.InterviewQuestionPromptService;
import com.interviewbuddy.question.dto.GeneratedQuestionResponse;
import com.interviewbuddy.question.dto.GenerateQuestionsRequest;
import com.interviewbuddy.question.dto.QuestionGenerationResponse;
import com.interviewbuddy.question.model.InterviewQuestion;
import com.interviewbuddy.question.repository.InterviewQuestionRepository;
import com.interviewbuddy.session.exception.InterviewSessionNotFoundException;
import com.interviewbuddy.session.model.InterviewSession;
import com.interviewbuddy.session.repository.InterviewSessionRepository;
import com.interviewbuddy.session.model.InterviewStatus;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestionGenerationService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final AiService aiService;
    private final InterviewQuestionPromptService promptService;

    public QuestionGenerationService(
            InterviewSessionRepository sessionRepository,
            InterviewQuestionRepository questionRepository,
            AiService aiService,
            InterviewQuestionPromptService promptService) {
        this.sessionRepository = sessionRepository;
        this.questionRepository = questionRepository;
        this.aiService = aiService;
        this.promptService = promptService;
    }

    @Transactional
    public QuestionGenerationResponse generate(Long sessionId, Long ownerId, GenerateQuestionsRequest request) {
        InterviewSession session = sessionRepository.findByIdAndOwner_Id(sessionId, ownerId)
                .orElseThrow(() -> new InterviewSessionNotFoundException(sessionId));
        int requestedCount = request.numberOfQuestions();
        AiGeneratedQuestions generated = aiService.generateStructuredResponse(
                promptService.systemPrompt(),
                promptService.userPrompt(session, requestedCount),
                AiGeneratedQuestions.class);

        validate(generated, requestedCount, session);

        // Count also covers legacy rows whose newly-added order column is still null before V2 is applied.
        int firstOrder = Math.max(
                questionRepository.findMaxQuestionOrder(sessionId),
                Math.toIntExact(questionRepository.countByInterviewSession_Id(sessionId)));
        List<InterviewQuestion> questions = java.util.stream.IntStream.range(0, generated.questions().size())
                .mapToObj(index -> {
                    AiGeneratedQuestion item = generated.questions().get(index);
                    return new InterviewQuestion(
                        session,
                        item.questionText().trim(),
                        item.suggestedAnswer().trim(),
                        firstOrder + index + 1,
                        session.getDifficulty(),
                        session.getTopic(),
                        normalize(item.evaluationCriteria()),
                        normalize(item.expectedKeyConcepts()));
                })
                .toList();

        List<GeneratedQuestionResponse> savedQuestions = questionRepository.saveAll(questions).stream()
                .map(this::toResponse)
                .toList();
        if (session.getStatus() == InterviewStatus.CREATED) {
            session.setStatus(InterviewStatus.QUESTIONS_GENERATED);
        } else if (session.getStatus() == InterviewStatus.COMPLETED) {
            session.setStatus(InterviewStatus.IN_PROGRESS);
        }
        return new QuestionGenerationResponse(savedQuestions);
    }

    @Transactional(readOnly = true)
    public List<GeneratedQuestionResponse> getQuestions(Long sessionId, Long ownerId) {
        sessionRepository.findByIdAndOwner_Id(sessionId, ownerId)
                .orElseThrow(() -> new InterviewSessionNotFoundException(sessionId));
        return questionRepository.findAllByInterviewSession_IdOrderByQuestionOrderAsc(sessionId).stream()
                .map(this::toResponse)
                .toList();
    }

    private void validate(AiGeneratedQuestions generated, int requestedCount, InterviewSession session) {
        if (generated == null
                || generated.questions() == null
                || generated.questions().size() != requestedCount) {
            throw AiServiceException.invalidResponse();
        }

        Set<String> uniqueQuestionTexts = new HashSet<>();
        for (AiGeneratedQuestion question : generated.questions()) {
            if (question == null
                    || question.questionText() == null
                    || question.questionText().isBlank()
                    || question.questionText().length() > 1000
                    || question.suggestedAnswer() == null
                    || question.suggestedAnswer().isBlank()
                    || question.suggestedAnswer().length() > 10000
                    || question.difficulty() != session.getDifficulty()
                    || question.topic() == null
                    || !question.topic().trim().equalsIgnoreCase(session.getTopic().trim())
                    || !validList(question.evaluationCriteria(), 1, 8, 500)
                    || !validList(question.expectedKeyConcepts(), 1, 10, 100)) {
                throw AiServiceException.invalidResponse();
            }
            String normalizedText = question.questionText().trim().toLowerCase(Locale.ROOT);
            if (!uniqueQuestionTexts.add(normalizedText)) {
                throw AiServiceException.invalidResponse();
            }
        }
    }

    private boolean validList(List<String> values, int minSize, int maxSize, int maxLength) {
        return values != null
                && values.size() >= minSize
                && values.size() <= maxSize
                && values.stream().allMatch(value -> value != null
                        && !value.isBlank()
                        && value.length() <= maxLength);
    }

    private List<String> normalize(List<String> values) {
        return values.stream().map(String::trim).toList();
    }

    private GeneratedQuestionResponse toResponse(InterviewQuestion question) {
        return new GeneratedQuestionResponse(
                question.getId(),
                question.getQuestionOrder(),
                question.getQuestionText(),
                question.getSuggestedAnswer(),
                question.getDifficulty(),
                question.getTopic(),
                question.getEvaluationCriteria(),
                question.getExpectedKeyConcepts(),
                question.getPracticeAnswer() == null ? null : question.getPracticeAnswer().getAnswerText(),
                question.getPracticeAnswer() == null ? null : question.getPracticeAnswer().getUpdatedAt(),
                question.getPracticeAnswer() == null ? null : question.getPracticeAnswer().getCompletedAt());
    }
}
