package com.interviewbuddy.question.model;

import com.interviewbuddy.session.model.Difficulty;
import com.interviewbuddy.session.model.InterviewSession;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "interview_questions")
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interview_session_id", nullable = false)
    private InterviewSession interviewSession;

    @Column(name = "question_text", nullable = false, length = 1000)
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty;

    @Column(nullable = false, length = 100)
    private String topic;

    @ElementCollection
    @CollectionTable(
            name = "interview_question_evaluation_criteria",
            joinColumns = @JoinColumn(name = "question_id", nullable = false))
    @OrderColumn(name = "criterion_order")
    @Column(name = "criterion", nullable = false, length = 500)
    private List<String> evaluationCriteria = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "interview_question_key_concepts",
            joinColumns = @JoinColumn(name = "question_id", nullable = false))
    @OrderColumn(name = "concept_order")
    @Column(name = "concept", nullable = false, length = 100)
    private List<String> expectedKeyConcepts = new ArrayList<>();

    protected InterviewQuestion() {
    }

    public InterviewQuestion(
            InterviewSession interviewSession,
            String questionText,
            Difficulty difficulty,
            String topic,
            List<String> evaluationCriteria,
            List<String> expectedKeyConcepts) {
        this.interviewSession = interviewSession;
        this.questionText = questionText;
        this.difficulty = difficulty;
        this.topic = topic;
        this.evaluationCriteria = new ArrayList<>(evaluationCriteria);
        this.expectedKeyConcepts = new ArrayList<>(expectedKeyConcepts);
    }

    public Long getId() { return id; }
    public InterviewSession getInterviewSession() { return interviewSession; }
    public String getQuestionText() { return questionText; }
    public Difficulty getDifficulty() { return difficulty; }
    public String getTopic() { return topic; }
    public List<String> getEvaluationCriteria() { return List.copyOf(evaluationCriteria); }
    public List<String> getExpectedKeyConcepts() { return List.copyOf(expectedKeyConcepts); }
}
