package com.interviewbuddy.question.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "question_practice_answers")
public class QuestionPracticeAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false, unique = true)
    private InterviewQuestion question;

    @Column(name = "answer_text", columnDefinition = "text")
    private String answerText;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected QuestionPracticeAnswer() {}

    public QuestionPracticeAnswer(InterviewQuestion question) {
        this.question = question;
        this.updatedAt = Instant.now();
    }

    public void updateAnswer(String answerText) {
        this.answerText = answerText;
        this.updatedAt = Instant.now();
        this.completedAt = null;
    }

    public void markCompleted() {
        this.completedAt = Instant.now();
        this.updatedAt = this.completedAt;
    }

    public Long getId() { return id; }
    public InterviewQuestion getQuestion() { return question; }
    public String getAnswerText() { return answerText; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getCompletedAt() { return completedAt; }
}
