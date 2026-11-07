package com.interviewbuddy.ai.controller;

import com.interviewbuddy.ai.exception.AiServiceException;
import com.interviewbuddy.ai.service.AiService;
import com.interviewbuddy.session.exception.ApiExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AiTestController.class)
@Import(ApiExceptionHandler.class)
class AiTestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AiService aiService;

    @Test
    void sendsPromptToAiServiceAndReturnsResponseDto() throws Exception {
        when(aiService.generateResponse(anyString())).thenReturn("Spring injects required objects for you.");

        mockMvc.perform(post("/api/ai/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(user("1")).with(csrf())
                        .content("""
                                {"prompt":"Explain dependency injection in Spring Boot in simple terms."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.response").value("Spring injects required objects for you."));

        verify(aiService).generateResponse("Explain dependency injection in Spring Boot in simple terms.");
    }

    @Test
    void rejectsBlankPrompt() throws Exception {
        mockMvc.perform(post("/api/ai/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(user("1")).with(csrf())
                        .content("{\"prompt\":\"  \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsPromptOverMaximumLength() throws Exception {
        String longPrompt = "a".repeat(2001);
        String body = "{\"prompt\":\"" + longPrompt + "\"}";

        mockMvc.perform(post("/api/ai/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(user("1")).with(csrf())
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnsSafeErrorForInvalidProviderCredentials() throws Exception {
        when(aiService.generateResponse(anyString())).thenThrow(AiServiceException.authenticationFailure(
                new IllegalStateException("provider supplied private credential details")));

        mockMvc.perform(post("/api/ai/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(user("1")).with(csrf())
                        .content("{\"prompt\":\"test\"}"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.detail").value("The AI provider credentials are missing or were rejected."))
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("private credential details"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("key"))));
    }

    @Test
    void returnsGatewayTimeoutForProviderTimeout() throws Exception {
        when(aiService.generateResponse(anyString())).thenThrow(AiServiceException.timeout());

        mockMvc.perform(post("/api/ai/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(user("1")).with(csrf())
                        .content("{\"prompt\":\"test\"}"))
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.detail").value("The AI provider request timed out."));
    }
}
