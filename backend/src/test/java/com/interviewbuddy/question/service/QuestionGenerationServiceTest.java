package com.interviewbuddy.question.service;

import com.interviewbuddy.ai.dto.AiGeneratedQuestion;
import com.interviewbuddy.ai.dto.AiGeneratedQuestions;
import com.interviewbuddy.ai.exception.AiServiceException;
import com.interviewbuddy.ai.service.AiService;
import com.interviewbuddy.ai.service.InterviewQuestionPromptService;
import com.interviewbuddy.question.dto.GeneratedQuestionResponse;
import com.interviewbuddy.question.dto.GenerateQuestionsRequest;
import com.interviewbuddy.question.model.InterviewQuestion;
import com.interviewbuddy.question.repository.InterviewQuestionRepository;
import com.interviewbuddy.session.exception.InterviewSessionNotFoundException;
import com.interviewbuddy.session.model.Difficulty;
import com.interviewbuddy.session.model.InterviewSession;
import com.interviewbuddy.session.model.InterviewStatus;
import com.interviewbuddy.session.model.InterviewType;
import com.interviewbuddy.session.repository.InterviewSessionRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class QuestionGenerationServiceTest {

    private final InterviewSessionRepository sessionRepository = mock(InterviewSessionRepository.class);
    private final InterviewQuestionRepository questionRepository = mock(InterviewQuestionRepository.class);
    private final AiService aiService = mock(AiService.class);
    private final InterviewQuestionPromptService promptService = new InterviewQuestionPromptService();
    private final QuestionGenerationService service = new QuestionGenerationService(
            sessionRepository, questionRepository, aiService, promptService);
    private final InterviewSession session = new InterviewSession(
            "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Spring Boot");

    @BeforeEach
    void setUp() {
        when(sessionRepository.findByIdAndOwner_Id(21L, 7L)).thenReturn(Optional.of(session));
        doAnswer(invocation -> invocation.getArgument(0))
                .when(questionRepository).saveAll(anyList());
    }

    @Test
    void generatesValidQuestionsAndPersistsTheirSessionAssociation() {
        AiGeneratedQuestions output = new AiGeneratedQuestions(List.of(
                question("How does dependency injection work?"),
                question("What is the purpose of a Spring bean?")));
        doReturn(output).when(aiService).generateStructuredResponse(
                anyString(), anyString(), eq(AiGeneratedQuestions.class));

        var response = service.generate(21L, 7L, new GenerateQuestionsRequest(2));

        assertThat(response.questions()).hasSize(2);
        assertThat(response.questions().get(0).questionText()).isEqualTo("How does dependency injection work?");
        assertThat(response.questions().get(0).questionOrder()).isEqualTo(1);
        assertThat(response.questions().get(0).suggestedAnswer()).contains("clear explanation");
        assertThat(response.questions().get(0).difficulty()).isEqualTo(Difficulty.INTERMEDIATE);
        assertThat(response.questions().get(0).topic()).isEqualTo("Spring Boot");
        assertThat(response.questions().get(0).evaluationCriteria()).containsExactly("Explains IoC accurately");
        assertThat(response.questions().get(0).expectedKeyConcepts()).containsExactly("IoC", "Spring beans");

        var promptCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(aiService).generateStructuredResponse(
                promptCaptor.capture(), promptCaptor.capture(), eq(AiGeneratedQuestions.class));
        assertThat(promptCaptor.getAllValues().get(0)).contains("expert interview coach");
        assertThat(promptCaptor.getAllValues().get(1))
                .contains("Backend Engineer", "INTERMEDIATE", "TECHNICAL", "Spring Boot", "exactly 2");

        var questionsCaptor = org.mockito.ArgumentCaptor.forClass(Iterable.class);
        verify(questionRepository).saveAll(questionsCaptor.capture());
        List<Object> savedQuestions = new java.util.ArrayList<>();
        questionsCaptor.getValue().forEach(savedQuestions::add);
        assertThat(savedQuestions).hasSize(2);
        assertThat(((InterviewQuestion) savedQuestions.get(0)).getInterviewSession()).isSameAs(session);
        assertThat(((InterviewQuestion) savedQuestions.get(0)).getQuestionOrder()).isEqualTo(1);
        assertThat(session.getStatus()).isEqualTo(com.interviewbuddy.session.model.InterviewStatus.QUESTIONS_GENERATED);
    }

    @Test
    void appendsAfterLegacyQuestionsWithoutOrderValues() {
        doReturn(new AiGeneratedQuestions(List.of(question("A newly generated question?"))))
                .when(aiService).generateStructuredResponse(
                        anyString(), anyString(), eq(AiGeneratedQuestions.class));
        when(questionRepository.findMaxQuestionOrder(21L)).thenReturn(0);
        when(questionRepository.countByInterviewSession_Id(21L)).thenReturn(4L);

        var response = service.generate(21L, 7L, new GenerateQuestionsRequest(1));

        assertThat(response.questions().getFirst().questionOrder()).isEqualTo(5);
    }

    @Test
    void regeneratingQuestionsDoesNotMoveAnInProgressSessionBackwards() {
        session.setStatus(InterviewStatus.IN_PROGRESS);
        doReturn(new AiGeneratedQuestions(List.of(question("A follow-up question?"))))
                .when(aiService).generateStructuredResponse(
                        anyString(), anyString(), eq(AiGeneratedQuestions.class));

        service.generate(21L, 7L, new GenerateQuestionsRequest(1));

        assertThat(session.getStatus()).isEqualTo(InterviewStatus.IN_PROGRESS);
    }

    @Test
    void doesNotSaveWhenAiReturnsWrongNumberOfQuestions() {
        doReturn(new AiGeneratedQuestions(List.of(question("Only one"))))
                .when(aiService).generateStructuredResponse(
                        anyString(), anyString(), eq(AiGeneratedQuestions.class));

        assertThatThrownBy(() -> service.generate(21L, 7L, new GenerateQuestionsRequest(2)))
                .isInstanceOf(AiServiceException.class)
                .hasMessage("The AI provider returned an invalid response.");
        verify(questionRepository, never()).saveAll(anyList());
    }

    @Test
    void doesNotSaveQuestionWithInvalidRequiredFields() {
        AiGeneratedQuestion invalidQuestion = new AiGeneratedQuestion(
                " ",
                Difficulty.INTERMEDIATE,
                "Spring Boot",
                List.of("Explains IoC accurately"),
                List.of("IoC"));
        doReturn(new AiGeneratedQuestions(List.of(invalidQuestion)))
                .when(aiService).generateStructuredResponse(
                        anyString(), anyString(), eq(AiGeneratedQuestions.class));

        assertThatThrownBy(() -> service.generate(21L, 7L, new GenerateQuestionsRequest(1)))
                .isInstanceOf(AiServiceException.class)
                .hasMessage("The AI provider returned an invalid response.");
        verify(questionRepository, never()).saveAll(anyList());
    }

    @Test
    void rejectsNullStructuredResponseWithoutSaving() {
        assertInvalidAiResponse(null, 1);
    }

    @Test
    void rejectsDifficultyThatDoesNotMatchSession() {
        assertInvalidAiResponse(new AiGeneratedQuestions(List.of(new AiGeneratedQuestion(
                "Explain how a Spring bean is created.",
                Difficulty.BEGINNER,
                "Spring Boot",
                List.of("Explains bean creation accurately"),
                List.of("ApplicationContext")))), 1);
    }

    @Test
    void rejectsTopicThatDoesNotMatchSession() {
        assertInvalidAiResponse(new AiGeneratedQuestions(List.of(new AiGeneratedQuestion(
                "Explain how a Spring bean is created.",
                Difficulty.INTERMEDIATE,
                "React",
                List.of("Explains the relevant concept"),
                List.of("ApplicationContext")))), 1);
    }

    @Test
    void rejectsCaseAndWhitespaceNormalizedDuplicateQuestions() {
        assertInvalidAiResponse(new AiGeneratedQuestions(List.of(
                question("How does dependency injection work?"),
                question("  HOW DOES DEPENDENCY INJECTION WORK?  "))), 2);
    }

    @Test
    void rejectsEmptyEvaluationCriteriaAndExpectedConcepts() {
        assertInvalidAiResponse(new AiGeneratedQuestions(List.of(new AiGeneratedQuestion(
                "Explain dependency injection.",
                Difficulty.INTERMEDIATE,
                "Spring Boot",
                List.of(),
                List.of()))), 1);
    }

    @Test
    void returnsNotFoundWhenInterviewSessionDoesNotExist() {
        when(sessionRepository.findByIdAndOwner_Id(404L, 7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.generate(404L, 7L, new GenerateQuestionsRequest(1)))
                .isInstanceOf(InterviewSessionNotFoundException.class);
        verify(aiService, never()).generateStructuredResponse(
                anyString(), anyString(), eq(AiGeneratedQuestions.class));
    }

    @Test
    void retrievesQuestionsForExistingSessionAsResponseDtos() {
        InterviewQuestion question = new InterviewQuestion(
                session,
                "How does dependency injection work?",
                Difficulty.INTERMEDIATE,
                "Spring Boot",
                List.of("Explains inversion of control"),
                List.of("IoC", "Beans"));
        when(questionRepository.findAllByInterviewSession_IdOrderByQuestionOrderAsc(21L))
                .thenReturn(List.of(question));

        List<GeneratedQuestionResponse> result = service.getQuestions(21L, 7L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).questionText()).isEqualTo("How does dependency injection work?");
        assertThat(result.get(0).difficulty()).isEqualTo(Difficulty.INTERMEDIATE);
        assertThat(result.get(0).topic()).isEqualTo("Spring Boot");
        assertThat(result.get(0).evaluationCriteria()).containsExactly("Explains inversion of control");
        assertThat(result.get(0).expectedKeyConcepts()).containsExactly("IoC", "Beans");
        verify(questionRepository).findAllByInterviewSession_IdOrderByQuestionOrderAsc(21L);
    }

    @Test
    void returnsEmptyListWhenSessionHasNoQuestions() {
        when(questionRepository.findAllByInterviewSession_IdOrderByQuestionOrderAsc(21L)).thenReturn(List.of());

        assertThat(service.getQuestions(21L, 7L)).isEmpty();
    }

    @Test
    void returnsNotFoundWhenRetrievingQuestionsForMissingSession() {
        when(sessionRepository.findByIdAndOwner_Id(404L, 7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getQuestions(404L, 7L))
                .isInstanceOf(InterviewSessionNotFoundException.class);
        verify(questionRepository, never()).findAllByInterviewSession_IdOrderByQuestionOrderAsc(404L);
    }

    private AiGeneratedQuestion question(String text) {
        return new AiGeneratedQuestion(
                text,
                Difficulty.INTERMEDIATE,
                "Spring Boot",
                List.of("Explains IoC accurately"),
                List.of("IoC", "Spring beans"));
    }

    private void assertInvalidAiResponse(AiGeneratedQuestions response, int requestedCount) {
        doReturn(response).when(aiService).generateStructuredResponse(
                anyString(), anyString(), eq(AiGeneratedQuestions.class));

        assertThatThrownBy(() -> service.generate(21L, 7L, new GenerateQuestionsRequest(requestedCount)))
                .isInstanceOf(AiServiceException.class)
                .hasMessage("The AI provider returned an invalid response.");
        verify(questionRepository, never()).saveAll(anyList());
    }
}
