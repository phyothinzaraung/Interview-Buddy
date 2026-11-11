package com.interviewbuddy.session.model;

import com.interviewbuddy.question.model.InterviewQuestion;
import com.interviewbuddy.auth.model.UserAccount;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "interview_sessions")
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_type", nullable = false, length = 30)
    private InterviewType interviewType;

    @Column(nullable = false, length = 100)
    private String topic;

    @Convert(converter = InterviewStatusConverter.class)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'CREATED'")
    private InterviewStatus status = InterviewStatus.CREATED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Nullable only to keep pre-authentication rows intact; application writes always set an owner.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_interview_sessions_owner"))
    private UserAccount owner;

    @OneToMany(mappedBy = "interviewSession", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<InterviewQuestion> questions = new ArrayList<>();

    protected InterviewSession() {
    }

    public InterviewSession(String role, Difficulty difficulty, InterviewType interviewType, String topic) {
        this.role = role;
        this.difficulty = difficulty;
        this.interviewType = interviewType;
        this.topic = topic;
    }

    public InterviewSession(String role, Difficulty difficulty, InterviewType interviewType, String topic, UserAccount owner) {
        this(role, difficulty, interviewType, topic);
        this.owner = owner;
    }

    public void updateDetails(String role, Difficulty difficulty, InterviewType interviewType, String topic) {
        this.role = role;
        this.difficulty = difficulty;
        this.interviewType = interviewType;
        this.topic = topic;
    }

    @PrePersist
    void setDefaults() {
        if (owner == null) {
            throw new IllegalStateException("Interview session owner is required.");
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = InterviewStatus.CREATED;
        }
    }

    public Long getId() { return id; }
    public String getRole() { return role; }
    public Difficulty getDifficulty() { return difficulty; }
    public InterviewType getInterviewType() { return interviewType; }
    public String getTopic() { return topic; }
    public InterviewStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public UserAccount getOwner() { return owner; }
    public void setStatus(InterviewStatus status) { this.status = status; }
}
