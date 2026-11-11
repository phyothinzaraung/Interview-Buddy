package com.interviewbuddy.ai.service;

import com.interviewbuddy.ai.exception.AiServiceException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.regex.Pattern;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private static final Pattern AUTHORIZATION_VALUE = Pattern.compile(
            "(?i)(authorization\\s*[:=]\\s*)(?:bearer\\s+)?[^\\s,;\\\"'}]+");
    private static final Pattern API_KEY_VALUE = Pattern.compile(
            "(?i)((?:openai[_-]?api[_-]?key|api[-_ ]?key)\\s*[:=]\\s*)[^\\s,;\\\"'}]+");
    private static final Pattern BEARER_TOKEN = Pattern.compile(
            "(?i)\\bbearer\\s+[A-Za-z0-9._~+/-]+=*");
    private static final Pattern OPENAI_KEY = Pattern.compile(
            "(?i)\\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{8,}\\b");
    private static final Pattern PROVIDER_KEY_ERROR = Pattern.compile(
            "(?i)(incorrect api key provided\\s*:\\s*)[^\\s,;\\\"'}]+");
    private static final Pattern SENSITIVE_PAYLOAD_FIELD = Pattern.compile(
            "(?i)((?:\\\"|')?(?:prompt|messages|content|input|request[_-]?body)(?:\\\"|')?\\s*[:=]\\s*)(\\\"(?:\\\\.|[^\\\"])*\\\"|'(?:\\\\.|[^'])*'|[^,;}\\s]+)");

    private final ChatClient chatClient;

    public AiService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public String generateResponse(String prompt) {
        try {
            String response = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();
            if (response == null || response.isBlank()) {
                throw AiServiceException.providerFailure();
            }
            return response;
        } catch (RuntimeException exception) {
            if (exception instanceof AiServiceException aiServiceException) {
                throw aiServiceException;
            }
            throw translate(exception, prompt);
        }
    }

    public <T> T generateStructuredResponse(String systemPrompt, String userPrompt, Class<T> responseType) {
        try {
            T response = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .call()
                    .entity(responseType);
            if (response == null) {
                throw AiServiceException.invalidResponse();
            }
            return response;
        } catch (RuntimeException exception) {
            if (exception instanceof AiServiceException aiServiceException) {
                throw aiServiceException;
            }
            throw translate(exception, systemPrompt, userPrompt);
        }
    }

    private AiServiceException translate(Throwable exception, String... sensitiveInputs) {
        logProviderFailure(exception, sensitiveInputs);
        if (hasAuthenticationFailure(exception)) {
            return AiServiceException.authenticationFailure(exception);
        }
        if (hasTimeout(exception)) {
            return AiServiceException.timeout(exception);
        }
        if (hasStructuredOutputFailure(exception)) {
            return AiServiceException.invalidResponse(exception);
        }
        return AiServiceException.providerFailure(exception);
    }

    private void logProviderFailure(Throwable exception, String... sensitiveInputs) {
        Integer httpStatus = findHttpStatus(exception);
        String status = httpStatus == null ? "unavailable" : httpStatus.toString();
        String message = safeMessage(exception.getMessage(), sensitiveInputs);
        Throwable rootCause = rootCause(exception);
        String rootCauseMessage = safeMessage(rootCause.getMessage(), sensitiveInputs);
        log.warn("OpenAI request failed: exceptionClass={}, rootCauseClass={}, httpStatus={}, message={}, rootCauseMessage={}",
                exception.getClass().getName(), rootCause.getClass().getName(), status, message, rootCauseMessage);
    }

    private Throwable rootCause(Throwable exception) {
        Throwable rootCause = exception;
        while (rootCause.getCause() != null && rootCause.getCause() != rootCause) {
            rootCause = rootCause.getCause();
        }
        return rootCause;
    }

    private Integer findHttpStatus(Throwable exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof RestClientResponseException responseException) {
                return responseException.getStatusCode().value();
            }
        }
        return null;
    }

    private String safeMessage(String message, String... sensitiveInputs) {
        if (message == null || message.isBlank()) {
            return "<no exception message>";
        }
        String sanitized = message;
        for (String sensitiveInput : sensitiveInputs) {
            if (sensitiveInput != null && !sensitiveInput.isBlank()) {
                sanitized = sanitized.replace(sensitiveInput, "[REDACTED]");
            }
        }
        sanitized = AUTHORIZATION_VALUE.matcher(sanitized).replaceAll("$1[REDACTED]");
        sanitized = API_KEY_VALUE.matcher(sanitized).replaceAll("$1[REDACTED]");
        sanitized = BEARER_TOKEN.matcher(sanitized).replaceAll("Bearer [REDACTED]");
        sanitized = OPENAI_KEY.matcher(sanitized).replaceAll("[REDACTED_API_KEY]");
        sanitized = PROVIDER_KEY_ERROR.matcher(sanitized).replaceAll("$1[REDACTED_API_KEY]");
        sanitized = SENSITIVE_PAYLOAD_FIELD.matcher(sanitized).replaceAll("$1[REDACTED]");
        sanitized = sanitized.replaceAll("[\\r\\n\\t]+", " ");
        return sanitized.length() <= 500 ? sanitized : sanitized.substring(0, 500) + "…";
    }

    private boolean hasStructuredOutputFailure(Throwable exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            String packageName = cause.getClass().getPackageName();
            String exceptionType = cause.getClass().getSimpleName();
            if (packageName.startsWith("com.fasterxml.jackson")
                    || exceptionType.contains("ConversionException")) {
                return true;
            }
        }
        return false;
    }

    private boolean hasAuthenticationFailure(Throwable exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof RestClientResponseException responseException) {
                HttpStatusCode status = responseException.getStatusCode();
                if (status.value() == 401 || status.value() == 403) {
                    return true;
                }
            }
            String exceptionType = cause.getClass().getSimpleName();
            if (exceptionType.contains("Unauthorized") || exceptionType.contains("Forbidden")) {
                return true;
            }
        }
        return false;
    }

    private boolean hasTimeout(Throwable exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof java.util.concurrent.TimeoutException
                    || cause instanceof java.net.SocketTimeoutException
                    || cause instanceof java.net.http.HttpTimeoutException
                    || cause.getClass().getSimpleName().contains("TimeoutException")) {
                return true;
            }
        }
        return false;
    }
}
