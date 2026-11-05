package com.interviewbuddy.question.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GenerateQuestionsRequest(
        @NotNull(message = "Number of questions is required")
        @Min(value = 1, message = "At least one question must be requested")
        @Max(value = 10, message = "At most 10 questions may be requested")
        Integer numberOfQuestions) {
}
