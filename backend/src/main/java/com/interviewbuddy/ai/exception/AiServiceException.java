package com.interviewbuddy.ai.exception;

import org.springframework.http.HttpStatus;

public class AiServiceException extends RuntimeException {

    private final HttpStatus status;

    private AiServiceException(HttpStatus status, String safeMessage, Throwable cause) {
        super(safeMessage, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static AiServiceException authenticationFailure() {
        return authenticationFailure(null);
    }

    public static AiServiceException authenticationFailure(Throwable cause) {
        return new AiServiceException(
                HttpStatus.BAD_GATEWAY,
                "The AI provider credentials are missing or were rejected.",
                cause);
    }

    public static AiServiceException timeout() {
        return timeout(null);
    }

    public static AiServiceException timeout(Throwable cause) {
        return new AiServiceException(HttpStatus.GATEWAY_TIMEOUT, "The AI provider request timed out.", cause);
    }

    public static AiServiceException providerFailure() {
        return providerFailure(null);
    }

    public static AiServiceException providerFailure(Throwable cause) {
        return new AiServiceException(HttpStatus.BAD_GATEWAY, "The AI provider request failed.", cause);
    }

    public static AiServiceException invalidResponse() {
        return invalidResponse(null);
    }

    public static AiServiceException invalidResponse(Throwable cause) {
        return new AiServiceException(
                HttpStatus.BAD_GATEWAY,
                "The AI provider returned an invalid response.",
                cause);
    }
}
