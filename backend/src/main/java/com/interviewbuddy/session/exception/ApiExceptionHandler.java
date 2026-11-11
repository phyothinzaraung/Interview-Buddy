package com.interviewbuddy.session.exception;

import com.interviewbuddy.ai.exception.AiServiceException;
import com.interviewbuddy.question.exception.QuestionNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(AiServiceException.class)
    public ProblemDetail handleAiServiceException(AiServiceException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(exception.getStatus(), exception.getMessage());
        problem.setTitle("AI service request failed");
        return problem;
    }

    @ExceptionHandler(InterviewSessionNotFoundException.class)
    public ProblemDetail handleInterviewSessionNotFound(InterviewSessionNotFoundException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        problem.setTitle("Interview session not found");
        return problem;
    }

    @ExceptionHandler(QuestionNotFoundException.class)
    public ProblemDetail handleQuestionNotFound(QuestionNotFoundException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        problem.setTitle("Interview question not found");
        return problem;
    }
}
