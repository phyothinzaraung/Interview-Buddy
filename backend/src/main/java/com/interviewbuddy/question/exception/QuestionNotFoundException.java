package com.interviewbuddy.question.exception;

public class QuestionNotFoundException extends RuntimeException {
    public QuestionNotFoundException(Long id) { super("Question not found: " + id); }
}
