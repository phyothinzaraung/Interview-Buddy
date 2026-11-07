package com.interviewbuddy.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewbuddy.ai.dto.AiGeneratedQuestion;
import com.interviewbuddy.ai.dto.AiGeneratedQuestions;
import com.interviewbuddy.ai.service.AiService;
import com.interviewbuddy.auth.dto.RegisterRequest;
import com.interviewbuddy.auth.repository.RefreshTokenRepository;
import com.interviewbuddy.auth.repository.UserAccountRepository;
import com.interviewbuddy.auth.security.JwtTokenService;
import jakarta.servlet.http.Cookie;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth_integration;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Transactional
class AuthIntegrationTest {

    private static final String ORIGIN = "http://localhost:5173";
    private static final String PASSWORD = "Safe-Interview-Password-123";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserAccountRepository users;
    @Autowired private RefreshTokenRepository refreshTokens;
    @Autowired private JwtTokenService jwtTokenService;
    @MockBean private AiService aiService;

    @BeforeEach
    void clearAuthData() {
        refreshTokens.deleteAll();
        users.deleteAll();
    }

    @Test
    void registersHashesPasswordAndReturnsOnlySafeProfileAndAccessToken() throws Exception {
        Csrf csrfToken = obtainCsrf();
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Origin", ORIGIN)
                        .cookie(csrfToken.cookie())
                        .header("X-XSRF-TOKEN", csrfToken.value())
                        .content("""
                                {"name":"Ada Lovelace","email":"Ada@Example.test",
                                 "password":"Safe-Interview-Password-123",
                                 "confirmPassword":"Safe-Interview-Password-123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.id").isNumber())
                .andExpect(jsonPath("$.user.name").value("Ada Lovelace"))
                .andExpect(jsonPath("$.user.email").value("ada@example.test"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andReturn();

        assertThat(users.count()).isEqualTo(1);
        assertThat(users.findByEmail("ada@example.test").orElseThrow().getPasswordHash())
                .isNotEqualTo(PASSWORD)
                .startsWith("$2");
        Cookie refreshCookie = result.getResponse().getCookie("refresh_token");
        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.isHttpOnly()).isTrue();
        assertThat(refreshCookie.getSecure()).isTrue();
        assertThat(refreshCookie.getPath()).isEqualTo("/api/auth");

        String accessToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("accessToken").asText();
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ada@example.test"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void rejectsMismatchedConfirmationAndDuplicateEmail() throws Exception {
        Csrf csrfToken = obtainCsrf();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Origin", ORIGIN)
                        .cookie(csrfToken.cookie())
                        .header("X-XSRF-TOKEN", csrfToken.value())
                        .content("""
                                {"name":"Ada","email":"ada@example.test",
                                 "password":"Safe-Interview-Password-123",
                                 "confirmPassword":"A-different-password-123"}
                                """))
                .andExpect(status().isBadRequest());

        register("Ada", "ada@example.test");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Origin", ORIGIN)
                        .cookie(csrfToken.cookie())
                        .header("X-XSRF-TOKEN", csrfToken.value())
                        .content("""
                                {"name":"Another Ada","email":"ADA@example.test",
                                 "password":"Safe-Interview-Password-456",
                                 "confirmPassword":"Safe-Interview-Password-456"}
                                """))
                .andExpect(status().isConflict());
        assertThat(users.count()).isEqualTo(1);
    }

    @Test
    void loginErrorsAreGenericAndRefreshRotatesThenLogoutRevokes() throws Exception {
        register("Grace Hopper", "grace@example.test");
        Csrf csrfToken = obtainCsrf();
        var wrongPassword = authPost("/api/auth/login", csrfToken, """
                {"email":"grace@example.test","password":"Wrong-Password-123"}
                """);
        wrongPassword.andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Invalid email or password, or the session has expired."));

        MvcResult login = authPost("/api/auth/login", csrfToken, """
                {"email":"GRACE@example.test","password":"Safe-Interview-Password-123"}
                """).andExpect(status().isOk()).andReturn();
        Cookie firstRefresh = login.getResponse().getCookie("refresh_token");
        assertThat(firstRefresh).isNotNull();

        MvcResult refreshed = mockMvc.perform(post("/api/auth/refresh")
                        .header("Origin", ORIGIN)
                        .cookie(csrfToken.cookie(), firstRefresh)
                        .header("X-XSRF-TOKEN", csrfToken.value()))
                .andExpect(status().isOk()).andReturn();
        Cookie rotatedRefresh = refreshed.getResponse().getCookie("refresh_token");
        assertThat(rotatedRefresh).isNotNull();
        assertThat(rotatedRefresh.getValue()).isNotEqualTo(firstRefresh.getValue());

        mockMvc.perform(post("/api/auth/refresh")
                        .header("Origin", ORIGIN)
                        .cookie(csrfToken.cookie(), firstRefresh)
                        .header("X-XSRF-TOKEN", csrfToken.value()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/logout")
                        .header("Origin", ORIGIN)
                        .cookie(csrfToken.cookie(), rotatedRefresh)
                        .header("X-XSRF-TOKEN", csrfToken.value()))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/auth/refresh")
                        .header("Origin", ORIGIN)
                        .cookie(csrfToken.cookie(), rotatedRefresh)
                        .header("X-XSRF-TOKEN", csrfToken.value()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsCookieOperationsFromUntrustedOriginsAndProtectsAuthenticatedEndpoints() throws Exception {
        Csrf csrfToken = obtainCsrf();
        mockMvc.perform(post("/api/auth/refresh")
                        .header("Origin", "https://malicious.example")
                        .cookie(csrfToken.cookie())
                        .header("X-XSRF-TOKEN", csrfToken.value()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/interviews")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedUsersCannotReadOrMutateInterviewsOrQuestions() throws Exception {
        String validSession = """
                {"role":"Backend Engineer","difficulty":"INTERMEDIATE",
                 "interviewType":"TECHNICAL","topic":"Java"}
                """;
        mockMvc.perform(post("/api/interviews").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(validSession))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/interviews/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/interviews/1/questions")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/interviews/1/questions/generate").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"numberOfQuestions\":1}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/interviews/1").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(validSession))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/interviews/1").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void interviewAndQuestionEndpointsAreScopedToTheAuthenticatedOwner() throws Exception {
        String ownerToken = createUserToken("Owner", "owner@example.test");
        String otherToken = createUserToken("Other", "other@example.test");
        MvcResult created = mockMvc.perform(post("/api/interviews")
                        .header("Authorization", "Bearer " + ownerToken)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"role":"Backend Engineer","difficulty":"INTERMEDIATE",
                                 "interviewType":"TECHNICAL","topic":"Java","userId":999999}
                                """))
                .andExpect(status().isCreated()).andReturn();
        long id = objectMapper.readTree(created.getResponse().getContentAsString()).path("id").asLong();

        MvcResult otherCreated = mockMvc.perform(post("/api/interviews")
                        .header("Authorization", "Bearer " + otherToken)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"role":"Product Manager","difficulty":"BEGINNER",
                                 "interviewType":"BEHAVIORAL","topic":"Leadership"}
                                """))
                .andExpect(status().isCreated()).andReturn();
        long otherId = objectMapper.readTree(otherCreated.getResponse().getContentAsString()).path("id").asLong();

        when(aiService.generateStructuredResponse(anyString(), anyString(), eq(AiGeneratedQuestions.class)))
                .thenReturn(new AiGeneratedQuestions(List.of(new AiGeneratedQuestion(
                        "How do you design a resilient service?",
                        com.interviewbuddy.session.model.Difficulty.INTERMEDIATE,
                        "Java",
                        List.of("Explains failure handling"),
                        List.of("Retries")))));
        mockMvc.perform(post("/api/interviews/{id}/questions/generate", id)
                        .header("Authorization", "Bearer " + ownerToken).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"numberOfQuestions\":1}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.questions.length()").value(1));
        mockMvc.perform(get("/api/interviews/{id}/questions", id)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].questionText").value("How do you design a resilient service?"));

        mockMvc.perform(get("/api/interviews").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(id));
        mockMvc.perform(get("/api/interviews").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(otherId));
        mockMvc.perform(get("/api/interviews/{id}", id).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/interviews/{id}", id)
                        .header("Authorization", "Bearer " + otherToken).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"role":"Changed","difficulty":"BEGINNER",
                                 "interviewType":"BEHAVIORAL","topic":"Changed"}
                                """))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/interviews/{id}", id)
                        .header("Authorization", "Bearer " + otherToken).with(csrf()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/interviews/{id}/questions", id)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/interviews/{id}/questions/generate", id)
                        .header("Authorization", "Bearer " + otherToken).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"numberOfQuestions\":1}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/interviews/{id}", otherId).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/interviews/{id}", otherId)
                        .header("Authorization", "Bearer " + ownerToken).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"role":"Changed","difficulty":"BEGINNER",
                                 "interviewType":"BEHAVIORAL","topic":"Changed"}
                                """))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/interviews/{id}", otherId)
                        .header("Authorization", "Bearer " + ownerToken).with(csrf()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/interviews/{id}/questions", otherId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/interviews/{id}/questions/generate", otherId)
                        .header("Authorization", "Bearer " + ownerToken).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"numberOfQuestions\":1}"))
                .andExpect(status().isNotFound());
        verify(aiService).generateStructuredResponse(anyString(), anyString(), eq(AiGeneratedQuestions.class));
    }

    private String register(String name, String email) throws Exception {
        Csrf csrfToken = obtainCsrf();
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Origin", ORIGIN)
                        .cookie(csrfToken.cookie())
                        .header("X-XSRF-TOKEN", csrfToken.value())
                        .content(objectMapper.writeValueAsString(new RegisterRequest(
                                name, email, PASSWORD, PASSWORD))))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("accessToken").asText();
    }

    private String createUserToken(String name, String email) {
        var user = users.saveAndFlush(new com.interviewbuddy.auth.model.UserAccount(
                name, email, "not-a-real-login-hash"));
        return jwtTokenService.createAccessToken(user);
    }

    private org.springframework.test.web.servlet.ResultActions authPost(String path, Csrf token, String body) throws Exception {
        return mockMvc.perform(post(path)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Origin", ORIGIN)
                .cookie(token.cookie())
                .header("X-XSRF-TOKEN", token.value())
                .content(body));
    }

    private Csrf obtainCsrf() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        return new Csrf(cookie, body.path("token").asText());
    }

    private record Csrf(Cookie cookie, String value) { }
}
