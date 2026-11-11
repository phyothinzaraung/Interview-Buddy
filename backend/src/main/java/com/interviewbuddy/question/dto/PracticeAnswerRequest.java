package com.interviewbuddy.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PracticeAnswerRequest(@NotBlank @Size(max = 10000) String answerText) {}
