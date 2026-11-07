package com.interviewbuddy.auth.exception;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException() {
        super("An account with this email address already exists.");
    }
}
