package com.interviewbuddy.question.dto;

import com.interviewbuddy.session.model.InterviewStatus;

public record PracticeProgressResponse(
        InterviewStatus status,
        long totalQuestions,
        long answeredQuestions,
        long completedQuestions,
        int progressPercent) {}
