package com.interviewbuddy.session.exception;

public class InterviewSessionNotFoundException extends RuntimeException {

    public InterviewSessionNotFoundException(Long id) {
        super("Interview session with id " + id + " was not found");
    }
}
