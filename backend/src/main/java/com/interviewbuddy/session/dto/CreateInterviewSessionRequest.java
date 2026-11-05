package com.interviewbuddy.session.dto;

import com.interviewbuddy.session.model.Difficulty;
import com.interviewbuddy.session.model.InterviewType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateInterviewSessionRequest(
        @NotBlank(message = "Role is required")
        @Size(max = 100, message = "Role must be at most 100 characters")
        String role,
        @NotNull(message = "Difficulty is required")
        Difficulty difficulty,
        @NotNull(message = "Interview type is required")
        InterviewType interviewType,
        @NotBlank(message = "Topic is required")
        @Size(max = 100, message = "Topic must be at most 100 characters")
        String topic) {
}
