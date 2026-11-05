package com.interviewbuddy.ai.dto;

import com.interviewbuddy.session.model.Difficulty;
import java.util.List;

public record AiGeneratedQuestion(
        String questionText,
        Difficulty difficulty,
        String topic,
        List<String> evaluationCriteria,
        List<String> expectedKeyConcepts) {
}
