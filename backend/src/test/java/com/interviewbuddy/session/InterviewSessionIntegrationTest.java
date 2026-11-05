package com.interviewbuddy.session;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewbuddy.session.model.Difficulty;
import com.interviewbuddy.session.model.InterviewSession;
import com.interviewbuddy.session.model.InterviewType;
import com.interviewbuddy.session.repository.InterviewSessionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:interview_buddy;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Transactional
class InterviewSessionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InterviewSessionRepository repository;

    @Test
    void createsAndPersistsInterviewSession() throws Exception {
        var result = mockMvc.perform(post("/api/interviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"role":"Backend Engineer","difficulty":"INTERMEDIATE",
                                 "interviewType":"TECHNICAL","topic":"Java"}
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(response.path("id").asLong()).isPositive();
        assertThat(response.path("role").asText()).isEqualTo("Backend Engineer");
        assertThat(response.path("difficulty").asText()).isEqualTo("INTERMEDIATE");
        assertThat(response.path("interviewType").asText()).isEqualTo("TECHNICAL");
        assertThat(response.path("topic").asText()).isEqualTo("Java");
        assertThat(response.path("createdAt").asText()).isNotBlank();
        assertThat(response.path("status").asText()).isEqualTo("NOT_STARTED");
        assertThat(repository.count()).isEqualTo(1);
    }

    @Test
    void getsSessionById() throws Exception {
        var created = repository.save(new InterviewSession(
                "Backend Engineer",
                Difficulty.INTERMEDIATE,
                InterviewType.TECHNICAL,
                "Java"));

        var result = mockMvc.perform(get("/api/interviews/{id}", created.getId()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(response.path("id").asLong()).isEqualTo(created.getId());
        assertThat(response.path("role").asText()).isEqualTo("Backend Engineer");
        assertThat(response.path("difficulty").asText()).isEqualTo("INTERMEDIATE");
        assertThat(response.path("interviewType").asText()).isEqualTo("TECHNICAL");
        assertThat(response.path("topic").asText()).isEqualTo("Java");
        assertThat(response.path("status").asText()).isEqualTo("NOT_STARTED");
        assertThat(response.path("createdAt").asText()).isNotBlank();
    }

    @Test
    void returnsNotFoundForUnknownId() throws Exception {
        mockMvc.perform(get("/api/interviews/{id}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    void updatesSessionAndPreservesIdAndCreatedAt() throws Exception {
        Instant createdAt = Instant.parse("2026-01-01T10:00:00Z");
        InterviewSession existing = new InterviewSession(
                "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Java");
        ReflectionTestUtils.setField(existing, "createdAt", createdAt);
        InterviewSession saved = repository.save(existing);
        Long id = saved.getId();

        var result = mockMvc.perform(put("/api/interviews/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"role":"Product Manager","difficulty":"BEGINNER",
                                 "interviewType":"BEHAVIORAL","topic":"Leadership"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(response.path("id").asLong()).isEqualTo(id);
        assertThat(response.path("role").asText()).isEqualTo("Product Manager");
        assertThat(response.path("difficulty").asText()).isEqualTo("BEGINNER");
        assertThat(response.path("interviewType").asText()).isEqualTo("BEHAVIORAL");
        assertThat(response.path("topic").asText()).isEqualTo("Leadership");
        assertThat(Instant.parse(response.path("createdAt").asText())).isEqualTo(createdAt);

        InterviewSession persisted = repository.findById(id).orElseThrow();
        assertThat(persisted.getId()).isEqualTo(id);
        assertThat(persisted.getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    void returnsNotFoundWhenUpdatingUnknownSession() throws Exception {
        mockMvc.perform(put("/api/interviews/{id}", 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"role":"Product Manager","difficulty":"BEGINNER",
                                 "interviewType":"BEHAVIORAL","topic":"Leadership"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletesSessionAndItIsNoLongerAvailable() throws Exception {
        InterviewSession saved = repository.save(new InterviewSession(
                "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Java"));
        Long id = saved.getId();

        var result = mockMvc.perform(delete("/api/interviews/{id}", id))
                .andExpect(status().isNoContent())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).isEmpty();
        assertThat(repository.findById(id)).isEmpty();
        mockMvc.perform(get("/api/interviews/{id}", id))
                .andExpect(status().isNotFound());

        var listResult = mockMvc.perform(get("/api/interviews"))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(listResult.getResponse().getContentAsString()).size()).isZero();
    }

    @Test
    void returnsNotFoundWhenDeletingUnknownSession() throws Exception {
        mockMvc.perform(delete("/api/interviews/{id}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsBlankRoleAndTopicAndNullEnumsOnUpdate() throws Exception {
        String[] invalidRequests = {
                """
                {"role":" ","difficulty":"BEGINNER","interviewType":"BEHAVIORAL","topic":"Leadership"}
                """,
                """
                {"role":"Product Manager","difficulty":"BEGINNER","interviewType":"BEHAVIORAL","topic":" "}
                """,
                """
                {"role":"Product Manager","difficulty":null,"interviewType":"BEHAVIORAL","topic":"Leadership"}
                """,
                """
                {"role":"Product Manager","difficulty":"BEGINNER","interviewType":null,"topic":"Leadership"}
                """
        };

        for (String body : invalidRequests) {
            mockMvc.perform(put("/api/interviews/{id}", 1)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void returnsEmptyArrayWhenThereAreNoSessions() throws Exception {
        var result = mockMvc.perform(get("/api/interviews"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(response.isArray()).isTrue();
        assertThat(response.size()).isZero();
    }

    @Test
    void returnsMultipleSessionsNewestFirst() throws Exception {
        InterviewSession older = new InterviewSession(
                "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Java");
        InterviewSession newer = new InterviewSession(
                "Product Manager", Difficulty.BEGINNER, InterviewType.BEHAVIORAL, "Leadership");
        ReflectionTestUtils.setField(older, "createdAt", Instant.parse("2026-01-01T10:00:00Z"));
        ReflectionTestUtils.setField(newer, "createdAt", Instant.parse("2026-01-02T10:00:00Z"));
        repository.save(older);
        repository.save(newer);

        var result = mockMvc.perform(get("/api/interviews"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(response.size()).isEqualTo(2);
        assertThat(response.get(0).path("role").asText()).isEqualTo("Product Manager");
        assertThat(response.get(1).path("role").asText()).isEqualTo("Backend Engineer");
        assertThat(response.get(0).path("createdAt").asText()).isEqualTo("2026-01-02T10:00:00Z");
    }

    @Test
    void rejectsInvalidRoleAndEnumValue() throws Exception {
        mockMvc.perform(post("/api/interviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"role":" ","difficulty":"EXPERT",
                                 "interviewType":"TECHNICAL","topic":"Java"}
                                """))
                .andExpect(status().isBadRequest());

        assertThat(repository.count()).isZero();
    }
}
