package com.interviewbuddy.session.dto;

import com.interviewbuddy.session.model.Difficulty;
import com.interviewbuddy.session.model.InterviewType;
import com.interviewbuddy.session.model.InterviewStatus;
import java.time.Instant;

public record InterviewSessionResponse(
        Long id,
        String role,
        Difficulty difficulty,
        InterviewType interviewType,
        String topic,
        InterviewStatus status,
        Instant createdAt) {
}
