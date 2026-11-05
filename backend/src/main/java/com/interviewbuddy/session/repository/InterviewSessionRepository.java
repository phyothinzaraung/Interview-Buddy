package com.interviewbuddy.session.repository;

import com.interviewbuddy.session.model.InterviewSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {

    List<InterviewSession> findAllByOrderByCreatedAtDesc();
}
