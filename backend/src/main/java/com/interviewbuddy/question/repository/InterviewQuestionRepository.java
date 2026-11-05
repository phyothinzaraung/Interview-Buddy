package com.interviewbuddy.question.repository;

import com.interviewbuddy.question.model.InterviewQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {

    List<InterviewQuestion> findAllByInterviewSession_IdOrderByIdAsc(Long sessionId);
}
