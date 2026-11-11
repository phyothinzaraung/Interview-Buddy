package com.interviewbuddy.question.controller;

import com.interviewbuddy.question.dto.PracticeAnswerRequest;
import com.interviewbuddy.question.dto.PracticeAnswerResponse;
import com.interviewbuddy.question.dto.PracticeProgressResponse;
import com.interviewbuddy.question.dto.InterviewPracticeResponse;
import com.interviewbuddy.question.service.QuestionPracticeService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class QuestionPracticeController {
    private final QuestionPracticeService service;
    public QuestionPracticeController(QuestionPracticeService service) { this.service = service; }

    @GetMapping("/api/interviews/{sessionId}/questions/{questionId}/answer")
    public PracticeAnswerResponse getAnswer(@PathVariable Long sessionId, @PathVariable Long questionId,
            Authentication auth) {
        return service.getAnswer(sessionId, questionId, ownerId(auth));
    }

    @PutMapping("/api/interviews/{sessionId}/questions/{questionId}/answer")
    public PracticeAnswerResponse saveAnswer(@PathVariable Long sessionId, @PathVariable Long questionId,
            @Valid @RequestBody PracticeAnswerRequest request, Authentication auth) {
        return service.saveAnswer(sessionId, questionId, ownerId(auth), request);
    }

    @PostMapping("/api/interviews/{sessionId}/questions/{questionId}/complete")
    public PracticeAnswerResponse markCompleted(@PathVariable Long sessionId, @PathVariable Long questionId,
            Authentication auth) {
        return service.markCompleted(sessionId, questionId, ownerId(auth));
    }

    @GetMapping("/api/interviews/{sessionId}/practice/progress")
    public PracticeProgressResponse getProgress(@PathVariable Long sessionId, Authentication auth) {
        return service.getProgress(sessionId, ownerId(auth));
    }

    @GetMapping("/api/interviews/{sessionId}/practice")
    public InterviewPracticeResponse getPracticeSession(@PathVariable Long sessionId, Authentication auth) {
        return service.getPracticeSession(sessionId, ownerId(auth));
    }

    private Long ownerId(Authentication authentication) { return Long.valueOf(authentication.getName()); }
}
