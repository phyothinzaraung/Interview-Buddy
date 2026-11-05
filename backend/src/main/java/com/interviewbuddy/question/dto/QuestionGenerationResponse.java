package com.interviewbuddy.question.dto;

import java.util.List;

public record QuestionGenerationResponse(List<GeneratedQuestionResponse> questions) {
}
