package com.interviewbuddy.question.controller;

import com.interviewbuddy.question.dto.GenerateQuestionsRequest;
import com.interviewbuddy.question.dto.GeneratedQuestionResponse;
import com.interviewbuddy.question.dto.QuestionGenerationResponse;
import com.interviewbuddy.question.service.QuestionGenerationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/interviews/{id}/questions")
public class QuestionGenerationController {

    private final QuestionGenerationService service;

    public QuestionGenerationController(QuestionGenerationService service) {
        this.service = service;
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionGenerationResponse generate(
            @PathVariable Long id,
            @Valid @RequestBody GenerateQuestionsRequest request,
            Authentication auth) {
        return service.generate(id, Long.valueOf(auth.getName()), request);
    }

    @GetMapping
    public List<GeneratedQuestionResponse> getQuestions(@PathVariable Long id, Authentication auth) {
        return service.getQuestions(id, Long.valueOf(auth.getName()));
    }
}
