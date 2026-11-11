package com.interviewbuddy.ai.dto;

import com.interviewbuddy.session.model.Difficulty;
import java.util.List;

public record AiGeneratedQuestion(
        String questionText,
        String suggestedAnswer,
        Difficulty difficulty,
        String topic,
        List<String> evaluationCriteria,
        List<String> expectedKeyConcepts) {
    public AiGeneratedQuestion(String questionText, Difficulty difficulty, String topic,
            List<String> evaluationCriteria, List<String> expectedKeyConcepts) {
        this(questionText, "A strong answer directly addresses the question with a clear explanation and relevant example.",
                difficulty, topic, evaluationCriteria, expectedKeyConcepts);
    }
}
