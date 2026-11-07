package com.interviewbuddy.session.service;

import com.interviewbuddy.session.dto.CreateInterviewSessionRequest;
import com.interviewbuddy.session.dto.InterviewSessionResponse;
import com.interviewbuddy.session.model.InterviewSession;
import com.interviewbuddy.session.exception.InterviewSessionNotFoundException;
import com.interviewbuddy.session.repository.InterviewSessionRepository;
import com.interviewbuddy.auth.repository.UserAccountRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InterviewSessionService {

    private final InterviewSessionRepository repository;
    private final UserAccountRepository userRepository;

    public InterviewSessionService(InterviewSessionRepository repository, UserAccountRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional
    public InterviewSessionResponse create(CreateInterviewSessionRequest request, Long ownerId) {
        var owner = userRepository.findById(ownerId).orElseThrow();
        InterviewSession session = new InterviewSession(
                request.role().trim(),
                request.difficulty(),
                request.interviewType(),
                request.topic().trim(),
                owner);
        return toResponse(repository.save(session));
    }

    @Transactional
    public InterviewSessionResponse update(Long id, Long ownerId, CreateInterviewSessionRequest request) {
        InterviewSession session = repository.findByIdAndOwner_Id(id, ownerId)
                .orElseThrow(() -> new InterviewSessionNotFoundException(id));
        session.updateDetails(
                request.role().trim(),
                request.difficulty(),
                request.interviewType(),
                request.topic().trim());
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public InterviewSessionResponse getById(Long id, Long ownerId) {
        InterviewSession session = repository.findByIdAndOwner_Id(id, ownerId)
                .orElseThrow(() -> new InterviewSessionNotFoundException(id));
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public List<InterviewSessionResponse> getAll(Long ownerId) {
        return repository.findAllByOwner_IdOrderByCreatedAtDesc(ownerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(Long id, Long ownerId) {
        InterviewSession session = repository.findByIdAndOwner_Id(id, ownerId)
                .orElseThrow(() -> new InterviewSessionNotFoundException(id));
        repository.delete(session);
    }

    private InterviewSessionResponse toResponse(InterviewSession session) {
        return new InterviewSessionResponse(
                session.getId(),
                session.getRole(),
                session.getDifficulty(),
                session.getInterviewType(),
                session.getTopic(),
                session.getStatus(),
                session.getCreatedAt());
    }
}
