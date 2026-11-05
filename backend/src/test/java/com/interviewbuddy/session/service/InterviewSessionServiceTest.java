package com.interviewbuddy.session.service;

import com.interviewbuddy.session.dto.CreateInterviewSessionRequest;
import com.interviewbuddy.session.dto.InterviewSessionResponse;
import com.interviewbuddy.session.model.Difficulty;
import com.interviewbuddy.session.model.InterviewSession;
import com.interviewbuddy.session.model.InterviewType;
import com.interviewbuddy.session.exception.InterviewSessionNotFoundException;
import com.interviewbuddy.session.repository.InterviewSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertThrows;
import java.util.Optional;
import java.util.List;
import java.time.Instant;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class InterviewSessionServiceTest {

    @Mock
    private InterviewSessionRepository repository;

    @InjectMocks
    private InterviewSessionService service;

    @Test
    void createsSessionAndTrimsTextFields() {
        when(repository.save(any(InterviewSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        CreateInterviewSessionRequest request = new CreateInterviewSessionRequest(
                "  Backend Engineer  ", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "  Java  ");

        var response = service.create(request);

        var captor = org.mockito.ArgumentCaptor.forClass(InterviewSession.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo("Backend Engineer");
        assertThat(captor.getValue().getTopic()).isEqualTo("Java");
        assertThat(response.role()).isEqualTo("Backend Engineer");
        assertThat(response.topic()).isEqualTo("Java");
        assertThat(response.difficulty()).isEqualTo(Difficulty.INTERMEDIATE);
        assertThat(response.interviewType()).isEqualTo(InterviewType.TECHNICAL);
    }

    @Test
    void getsSessionById() {
        InterviewSession session = new InterviewSession(
                "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Java");
        when(repository.findById(42L)).thenReturn(Optional.of(session));

        var response = service.getById(42L);

        assertThat(response.role()).isEqualTo("Backend Engineer");
        assertThat(response.status().name()).isEqualTo("NOT_STARTED");
        verify(repository).findById(42L);
    }

    @Test
    void throwsNotFoundWhenSessionDoesNotExist() {
        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(InterviewSessionNotFoundException.class, () -> service.getById(404L));
    }

    @Test
    void updatesSessionFieldsAndPreservesIdentityAndCreationTime() {
        InterviewSession session = new InterviewSession(
                "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Java");
        Instant createdAt = Instant.parse("2026-01-01T10:00:00Z");
        ReflectionTestUtils.setField(session, "id", 42L);
        ReflectionTestUtils.setField(session, "createdAt", createdAt);
        when(repository.findById(42L)).thenReturn(Optional.of(session));
        CreateInterviewSessionRequest request = new CreateInterviewSessionRequest(
                "  Product Manager  ", Difficulty.BEGINNER, InterviewType.BEHAVIORAL, "  Leadership  ");

        var response = service.update(42L, request);

        assertThat(response.id()).isEqualTo(42L);
        assertThat(response.role()).isEqualTo("Product Manager");
        assertThat(response.difficulty()).isEqualTo(Difficulty.BEGINNER);
        assertThat(response.interviewType()).isEqualTo(InterviewType.BEHAVIORAL);
        assertThat(response.topic()).isEqualTo("Leadership");
        assertThat(response.createdAt()).isEqualTo(createdAt);
        verify(repository).findById(42L);
    }

    @Test
    void updateThrowsNotFoundWhenSessionDoesNotExist() {
        when(repository.findById(404L)).thenReturn(Optional.empty());
        CreateInterviewSessionRequest request = new CreateInterviewSessionRequest(
                "Product Manager", Difficulty.BEGINNER, InterviewType.BEHAVIORAL, "Leadership");

        assertThrows(InterviewSessionNotFoundException.class, () -> service.update(404L, request));
    }

    @Test
    void deletesExistingSession() {
        InterviewSession session = new InterviewSession(
                "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Java");
        when(repository.findById(42L)).thenReturn(Optional.of(session));

        service.delete(42L);

        verify(repository).findById(42L);
        verify(repository).delete(session);
    }

    @Test
    void deleteThrowsNotFoundWhenSessionDoesNotExist() {
        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(InterviewSessionNotFoundException.class, () -> service.delete(404L));
    }

    @Test
    void getsAllSessionsAsResponseDtos() {
        InterviewSession first = new InterviewSession(
                "Backend Engineer", Difficulty.INTERMEDIATE, InterviewType.TECHNICAL, "Java");
        InterviewSession second = new InterviewSession(
                "Product Manager", Difficulty.BEGINNER, InterviewType.BEHAVIORAL, "Leadership");
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(first, second));

        var responses = service.getAll();

        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(InterviewSessionResponse::role)
                .containsExactly("Backend Engineer", "Product Manager");
        assertThat(responses).extracting(InterviewSessionResponse::status)
                .containsOnly(com.interviewbuddy.session.model.InterviewStatus.NOT_STARTED);
        verify(repository).findAllByOrderByCreatedAtDesc();
    }

    @Test
    void getsEmptyListWhenNoSessionsExist() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());

        assertThat(service.getAll()).isEmpty();
        verify(repository).findAllByOrderByCreatedAtDesc();
    }

}
