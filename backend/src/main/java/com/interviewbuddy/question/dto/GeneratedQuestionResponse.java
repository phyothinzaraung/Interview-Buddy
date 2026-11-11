package com.interviewbuddy.question.dto;

import com.interviewbuddy.session.model.Difficulty;
import java.util.List;

public record GeneratedQuestionResponse(
        Long id,
        int questionOrder,
        String questionText,
        String suggestedAnswer,
        Difficulty difficulty,
        String topic,
        List<String> evaluationCriteria,
        List<String> expectedKeyConcepts,
        String practiceAnswer,
        java.time.Instant practiceAnswerUpdatedAt,
        java.time.Instant completedAt) {
    public GeneratedQuestionResponse(Long id, String questionText, Difficulty difficulty, String topic,
            List<String> evaluationCriteria, List<String> expectedKeyConcepts) {
        this(id, 0, questionText, null, difficulty, topic, evaluationCriteria, expectedKeyConcepts,
                null, null, null);
    }
}
