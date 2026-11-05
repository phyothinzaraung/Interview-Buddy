package com.interviewbuddy.ai.service;

import com.interviewbuddy.ai.exception.AiServiceException;
import com.interviewbuddy.ai.dto.AiGeneratedQuestion;
import com.interviewbuddy.ai.dto.AiGeneratedQuestions;
import com.interviewbuddy.session.model.Difficulty;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class AiServiceTest {

    private final ChatClient.Builder builder = mock(ChatClient.Builder.class);
    private final ChatClient chatClient = mock(ChatClient.class);
    private final ChatClient.ChatClientRequestSpec requestSpec = mock(ChatClient.ChatClientRequestSpec.class);
    private final ChatClient.CallResponseSpec responseSpec = mock(ChatClient.CallResponseSpec.class);
    private AiService service;

    @BeforeEach
    void setUp() {
        when(builder.build()).thenReturn(chatClient);
        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.system(org.mockito.ArgumentMatchers.anyString())).thenReturn(requestSpec);
        when(requestSpec.user(org.mockito.ArgumentMatchers.anyString())).thenReturn(requestSpec);
        when(requestSpec.call()).thenReturn(responseSpec);
        service = new AiService(builder);
    }

    @Test
    void returnsModelResponse() {
        when(responseSpec.content()).thenReturn("Dependency injection supplies a class with its dependencies.");

        String response = service.generateResponse("Explain dependency injection in Spring Boot in simple terms.");

        assertThat(response).contains("dependencies");
    }

    @Test
    void mapsStructuredResponseToRequestedType() {
        AiGeneratedQuestions expected = new AiGeneratedQuestions(List.of(new AiGeneratedQuestion(
                "Explain dependency injection.",
                Difficulty.INTERMEDIATE,
                "Spring Boot",
                List.of("Explains inversion of control"),
                List.of("IoC", "Beans"))));
        when(responseSpec.entity(AiGeneratedQuestions.class)).thenReturn(expected);

        AiGeneratedQuestions result = service.generateStructuredResponse(
                "System instructions", "Generate one question", AiGeneratedQuestions.class);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void logsSafeAuthenticationDiagnosticsAndPreservesOriginalCause(CapturedOutput output) {
        String fakeKey = "sk-proj-test-token-123456789";
        String fakeAuthorizationToken = "test-bearer-value-123456789";
        String prompt = "private interview payload";
        var unauthorized = HttpClientErrorException.create(
                HttpStatus.UNAUTHORIZED,
                "Unauthorized for prompt=" + prompt + "; Authorization: Bearer "
                        + fakeAuthorizationToken + "; Incorrect API key provided: " + fakeKey,
                HttpHeaders.EMPTY,
                new byte[0],
                StandardCharsets.UTF_8);
        when(responseSpec.content()).thenThrow(unauthorized);

        assertThatThrownBy(() -> service.generateResponse(prompt))
                .isInstanceOf(AiServiceException.class)
                .hasMessage("The AI provider credentials are missing or were rejected.")
                .hasCause(unauthorized);
        assertThat(output.getAll())
                .contains("exceptionClass=org.springframework.web.client.HttpClientErrorException")
                .contains("rootCauseClass=org.springframework.web.client.HttpClientErrorException")
                .contains("httpStatus=401")
                .doesNotContain(fakeKey)
                .doesNotContain(fakeAuthorizationToken)
                .doesNotContain(prompt);
    }

    @Test
    void translatesMissingCredentialFailureToGenericProviderError() {
        when(responseSpec.content()).thenThrow(new IllegalStateException("API key must not be exposed"));

        assertThatThrownBy(() -> service.generateResponse("test"))
                .isInstanceOf(AiServiceException.class)
                .hasMessage("The AI provider request failed.")
                .hasCauseInstanceOf(IllegalStateException.class);
    }

    @Test
    void translatesTimeoutFailure() {
        ResourceAccessException original = new ResourceAccessException(
                "request failed", new SocketTimeoutException("secret detail"));
        when(responseSpec.content()).thenThrow(original);

        assertThatThrownBy(() -> service.generateResponse("test"))
                .isInstanceOf(AiServiceException.class)
                .hasMessage("The AI provider request timed out.")
                .hasCause(original);
    }
}
