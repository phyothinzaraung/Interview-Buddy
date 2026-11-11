package com.interviewbuddy.question.dto;

import java.time.Instant;

public record PracticeAnswerResponse(Long questionId, String answerText, Instant updatedAt, Instant completedAt) {}
