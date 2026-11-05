package com.interviewbuddy.question.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class QuestionGenerationEvaluationDatasetTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void datasetContainsTwentyWellFormedScenariosAcrossRolesAndDifficulties() throws IOException {
        try (InputStream input = getClass().getResourceAsStream(
                "/question-generation-evaluation.json")) {
            assertThat(input).as("evaluation dataset resource").isNotNull();
            JsonNode root = objectMapper.readTree(input);
            JsonNode scenarios = root.path("scenarios");

            assertThat(scenarios.size()).isEqualTo(20);
            assertThat(root.path("requestedQuestionCount").asInt()).isEqualTo(5);

            Set<String> ids = new HashSet<>();
            Set<String> roleGroups = new HashSet<>();
            Set<String> difficulties = new HashSet<>();
            Map<String, Set<String>> difficultiesByRole = new HashMap<>();
            StreamSupport.stream(scenarios.spliterator(), false).forEach(scenario -> {
                ids.add(scenario.path("id").asText());
                String roleGroup = scenario.path("roleGroup").asText();
                String difficulty = scenario.path("difficulty").asText();
                roleGroups.add(roleGroup);
                difficulties.add(difficulty);
                difficultiesByRole.computeIfAbsent(roleGroup, ignored -> new HashSet<>()).add(difficulty);
                assertThat(scenario.path("role").asText()).isNotBlank();
                assertThat(scenario.path("interviewType").asText()).isNotBlank();
                assertThat(scenario.path("topic").asText()).isNotBlank();
                assertThat(scenario.path("relevanceSignals").isArray()).isTrue();
                assertThat(scenario.path("relevanceSignals").size()).isPositive();
                assertThat(scenario.path("difficultySignals").isArray()).isTrue();
                assertThat(scenario.path("difficultySignals").size()).isPositive();
            });

            assertThat(ids).hasSize(20);
            assertThat(roleGroups).containsExactlyInAnyOrder(
                    "Java Backend Developer",
                    "Spring Boot Developer",
                    "React Developer",
                    "Node.js Developer",
                    "Full Stack Developer",
                    "System Design");
            assertThat(difficulties).containsExactlyInAnyOrder("BEGINNER", "INTERMEDIATE", "ADVANCED");
            difficultiesByRole.forEach((role, levels) ->
                    assertThat(levels).as("difficulty coverage for %s", role)
                            .containsExactlyInAnyOrder("BEGINNER", "INTERMEDIATE", "ADVANCED"));
        }
    }
}
