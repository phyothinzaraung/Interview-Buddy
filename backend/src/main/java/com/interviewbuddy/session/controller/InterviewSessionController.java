package com.interviewbuddy.session.controller;

import com.interviewbuddy.session.dto.CreateInterviewSessionRequest;
import com.interviewbuddy.session.dto.InterviewSessionResponse;
import com.interviewbuddy.session.service.InterviewSessionService;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/interviews")
public class InterviewSessionController {

    private final InterviewSessionService service;

    public InterviewSessionController(InterviewSessionService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InterviewSessionResponse create(@Valid @RequestBody CreateInterviewSessionRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public InterviewSessionResponse update(
            @PathVariable Long id,
            @Valid @RequestBody CreateInterviewSessionRequest request) {
        return service.update(id, request);
    }

    @GetMapping("/{id}")
    public InterviewSessionResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<InterviewSessionResponse> getAll() {
        return service.getAll();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
