package com.interviewbuddy.question.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interviewbuddy.question.dto.PracticeAnswerRequest;
import com.interviewbuddy.question.exception.QuestionNotFoundException;
import com.interviewbuddy.question.model.InterviewQuestion;
import com.interviewbuddy.question.model.QuestionPracticeAnswer;
import com.interviewbuddy.question.repository.InterviewQuestionRepository;
import com.interviewbuddy.question.repository.QuestionPracticeAnswerRepository;
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

class QuestionPracticeServiceTest {
    private final InterviewSessionRepository sessions = org.mockito.Mockito.mock(InterviewSessionRepository.class);
    private final InterviewQuestionRepository questions = org.mockito.Mockito.mock(InterviewQuestionRepository.class);
    private final QuestionPracticeAnswerRepository answers = org.mockito.Mockito.mock(QuestionPracticeAnswerRepository.class);
    private final QuestionGenerationService generationService = org.mockito.Mockito.mock(QuestionGenerationService.class);
    private final QuestionPracticeService service = new QuestionPracticeService(sessions, questions, answers, generationService);
    private final InterviewSession session = new InterviewSession(
            "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Spring Boot");
    private final InterviewQuestion question = new InterviewQuestion(session, "Explain DI.", Difficulty.INTERMEDIATE,
            "Spring Boot", List.of("Accuracy"), List.of("IoC"));

    @BeforeEach
    void setUp() {
        when(questions.findOwnedQuestion(90L, 21L, 7L)).thenReturn(Optional.of(question));
        when(sessions.findByIdAndOwner_Id(21L, 7L)).thenReturn(Optional.of(session));
        when(questions.findAllByInterviewSession_IdOrderByQuestionOrderAsc(org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(question));
        when(answers.save(org.mockito.ArgumentMatchers.any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void savesUpdatesAndRetrievesPracticeAnswer() {
        var saved = service.saveAnswer(21L, 90L, 7L, new PracticeAnswerRequest("  I would explain inversion of control.  "));
        assertThat(saved.answerText()).isEqualTo("I would explain inversion of control.");
        assertThat(session.getStatus()).isEqualTo(InterviewStatus.IN_PROGRESS);

        var retrieved = service.getAnswer(21L, 90L, 7L);
        assertThat(retrieved.answerText()).isEqualTo(saved.answerText());
        assertThat(retrieved.updatedAt()).isNotNull();
    }

    @Test
    void completionUpdatesLifecycleAndProgress() {
        service.markCompleted(21L, 90L, 7L);
        var progress = service.getProgress(21L, 7L);
        assertThat(progress.totalQuestions()).isEqualTo(1);
        assertThat(progress.completedQuestions()).isEqualTo(1);
        assertThat(progress.progressPercent()).isEqualTo(100);
        assertThat(progress.status()).isEqualTo(InterviewStatus.COMPLETED);
        assertThat(session.getStatus()).isEqualTo(InterviewStatus.COMPLETED);
    }

    @Test
    void answerEditClearsCompletionAndReopensSession() {
        service.markCompleted(21L, 90L, 7L);
        var updated = service.saveAnswer(21L, 90L, 7L, new PracticeAnswerRequest("A more complete answer."));
        assertThat(updated.completedAt()).isNull();
        assertThat(session.getStatus()).isEqualTo(InterviewStatus.IN_PROGRESS);
    }

    @Test
    void hidesQuestionFromAnotherOwnerOrSession() {
        when(questions.findOwnedQuestion(90L, 21L, 8L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getAnswer(21L, 90L, 8L)).isInstanceOf(QuestionNotFoundException.class);
        verify(questions).findOwnedQuestion(90L, 21L, 8L);
    }

    @Test
    void hidesProgressForAnotherOwner() {
        when(sessions.findByIdAndOwner_Id(21L, 8L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getProgress(21L, 8L)).isInstanceOf(InterviewSessionNotFoundException.class);
    }
}
