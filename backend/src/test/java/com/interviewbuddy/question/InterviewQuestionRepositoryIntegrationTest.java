package com.interviewbuddy.question;

import com.interviewbuddy.question.model.InterviewQuestion;
import com.interviewbuddy.question.repository.InterviewQuestionRepository;
import com.interviewbuddy.session.model.Difficulty;
import com.interviewbuddy.session.model.InterviewSession;
import com.interviewbuddy.session.model.InterviewType;
import com.interviewbuddy.session.repository.InterviewSessionRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:question_db;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Transactional
class InterviewQuestionRepositoryIntegrationTest {

    @Autowired
    private InterviewSessionRepository sessionRepository;

    @Autowired
    private InterviewQuestionRepository questionRepository;

    @Test
    void persistsQuestionAndStructuredDetailsForItsSession() {
        InterviewSession session = sessionRepository.save(new InterviewSession(
                "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Spring Boot"));
        InterviewQuestion question = questionRepository.save(new InterviewQuestion(
                session,
                "How does dependency injection work?",
                Difficulty.INTERMEDIATE,
                "Spring Boot",
                List.of("Explains IoC accurately", "Uses a relevant example"),
                List.of("IoC", "Spring beans")));

        questionRepository.flush();
        InterviewQuestion persisted = questionRepository.findById(question.getId()).orElseThrow();

        assertThat(persisted.getInterviewSession().getId()).isEqualTo(session.getId());
        assertThat(persisted.getQuestionText()).isEqualTo("How does dependency injection work?");
        assertThat(persisted.getEvaluationCriteria())
                .containsExactly("Explains IoC accurately", "Uses a relevant example");
        assertThat(persisted.getExpectedKeyConcepts()).containsExactly("IoC", "Spring beans");
    }

    @Test
    void retrievesQuestionsForSessionOrderedByIdAscending() {
        InterviewSession session = sessionRepository.save(new InterviewSession(
                "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Spring Boot"));
        InterviewQuestion first = questionRepository.save(new InterviewQuestion(
                session, "First question", Difficulty.INTERMEDIATE, "Spring Boot",
                List.of("Criterion"), List.of("Concept")));
        InterviewQuestion second = questionRepository.save(new InterviewQuestion(
                session, "Second question", Difficulty.INTERMEDIATE, "Spring Boot",
                List.of("Criterion"), List.of("Concept")));
        questionRepository.flush();

        List<InterviewQuestion> questions = questionRepository
                .findAllByInterviewSession_IdOrderByIdAsc(session.getId());

        assertThat(questions).extracting(InterviewQuestion::getId)
                .containsExactly(first.getId(), second.getId());
    }

    @Test
    void deletingSessionRemovesItsOwnedQuestionsAndChildRows() {
        InterviewSession session = sessionRepository.save(new InterviewSession(
                "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Spring Boot"));
        questionRepository.save(new InterviewQuestion(
                session,
                "How does dependency injection work?",
                Difficulty.INTERMEDIATE,
                "Spring Boot",
                List.of("Explains IoC accurately"),
                List.of("IoC", "Spring beans")));

        sessionRepository.delete(session);
        sessionRepository.flush();

        assertThat(questionRepository.count()).isZero();
    }
}
