package com.interviewbuddy.auth.exception;

public class InvalidRefreshTokenException extends RuntimeException {
    public InvalidRefreshTokenException() {
        super("Your session has expired. Please sign in again.");
    }
}
