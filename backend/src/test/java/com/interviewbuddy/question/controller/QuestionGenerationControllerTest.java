package com.interviewbuddy.question.controller;

import com.interviewbuddy.question.dto.GeneratedQuestionResponse;
import com.interviewbuddy.question.dto.QuestionGenerationResponse;
import com.interviewbuddy.question.service.QuestionGenerationService;
import com.interviewbuddy.session.exception.ApiExceptionHandler;
import com.interviewbuddy.session.exception.InterviewSessionNotFoundException;
import com.interviewbuddy.session.model.Difficulty;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(QuestionGenerationController.class)
@Import(ApiExceptionHandler.class)
class QuestionGenerationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private QuestionGenerationService service;

    @Test
    void validatesRequestAndReturnsGeneratedQuestionDtos() throws Exception {
        when(service.generate(org.mockito.ArgumentMatchers.eq(12L), org.mockito.ArgumentMatchers.eq(12L), any()))
                .thenReturn(new QuestionGenerationResponse(List.of(new GeneratedQuestionResponse(
                        91L,
                        "How does dependency injection work?",
                        Difficulty.INTERMEDIATE,
                        "Spring Boot",
                        List.of("Explains IoC accurately"),
                        List.of("IoC", "Spring beans")))));

        mockMvc.perform(post("/api/interviews/{id}/questions/generate", 12)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(user("12")).with(csrf())
                        .content("{\"numberOfQuestions\":1}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.questions[0].id").value(91))
                .andExpect(jsonPath("$.questions[0].questionText").value("How does dependency injection work?"))
                .andExpect(jsonPath("$.questions[0].evaluationCriteria[0]").value("Explains IoC accurately"))
                .andExpect(jsonPath("$.questions[0].expectedKeyConcepts[1]").value("Spring beans"));
    }

    @Test
    void rejectsQuestionCountsOutsideOneToTen() throws Exception {
        mockMvc.perform(post("/api/interviews/{id}/questions/generate", 12)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(user("12")).with(csrf())
                        .content("{\"numberOfQuestions\":0}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/interviews/{id}/questions/generate", 12)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(user("12")).with(csrf())
                        .content("{\"numberOfQuestions\":11}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/interviews/{id}/questions/generate", 12)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(user("12")).with(csrf())
                        .content("{\"numberOfQuestions\":null}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void mapsMissingSessionToNotFound() throws Exception {
        when(service.generate(org.mockito.ArgumentMatchers.eq(404L), org.mockito.ArgumentMatchers.eq(12L), any()))
                .thenThrow(new InterviewSessionNotFoundException(404L));

        mockMvc.perform(post("/api/interviews/{id}/questions/generate", 404)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(user("12")).with(csrf())
                        .content("{\"numberOfQuestions\":1}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void returnsQuestionsForSession() throws Exception {
        when(service.getQuestions(12L, 12L)).thenReturn(List.of(new GeneratedQuestionResponse(
                91L,
                "How does dependency injection work?",
                Difficulty.INTERMEDIATE,
                "Spring Boot",
                List.of("Explains IoC accurately"),
                List.of("IoC", "Spring beans"))));

        mockMvc.perform(get("/api/interviews/{id}/questions", 12).with(user("12")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(91))
                .andExpect(jsonPath("$[0].questionText").value("How does dependency injection work?"))
                .andExpect(jsonPath("$[0].difficulty").value("INTERMEDIATE"))
                .andExpect(jsonPath("$[0].topic").value("Spring Boot"))
                .andExpect(jsonPath("$[0].evaluationCriteria[0]").value("Explains IoC accurately"))
                .andExpect(jsonPath("$[0].expectedKeyConcepts[1]").value("Spring beans"));
    }

    @Test
    void returnsEmptyArrayWhenSessionHasNoQuestions() throws Exception {
        when(service.getQuestions(12L, 12L)).thenReturn(List.of());

        mockMvc.perform(get("/api/interviews/{id}/questions", 12).with(user("12")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void mapsMissingSessionToNotFoundWhenRetrievingQuestions() throws Exception {
        when(service.getQuestions(404L, 12L)).thenThrow(new InterviewSessionNotFoundException(404L));

        mockMvc.perform(get("/api/interviews/{id}/questions", 404).with(user("12")))
                .andExpect(status().isNotFound());
    }
}
