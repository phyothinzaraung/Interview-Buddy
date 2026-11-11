package com.interviewbuddy.question.dto;

import com.interviewbuddy.session.dto.InterviewSessionResponse;
import java.util.List;

public record InterviewPracticeResponse(
        InterviewSessionResponse session,
        List<GeneratedQuestionResponse> questions,
        PracticeProgressResponse progress) {}
