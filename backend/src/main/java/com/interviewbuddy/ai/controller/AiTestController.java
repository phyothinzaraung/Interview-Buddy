package com.interviewbuddy.ai.controller;

import com.interviewbuddy.ai.dto.AiTestRequest;
import com.interviewbuddy.ai.dto.AiTestResponse;
import com.interviewbuddy.ai.service.AiService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiTestController {

    private final AiService aiService;

    public AiTestController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/test")
    public AiTestResponse test(@Valid @RequestBody AiTestRequest request) {
        return new AiTestResponse(aiService.generateResponse(request.prompt()));
    }
}
