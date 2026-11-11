package com.interviewbuddy.question.repository;

import com.interviewbuddy.question.model.InterviewQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {

    @EntityGraph(attributePaths = "practiceAnswer")
    List<InterviewQuestion> findAllByInterviewSession_IdOrderByQuestionOrderAsc(Long sessionId);

    @Query("select q from InterviewQuestion q join fetch q.interviewSession s left join fetch q.practiceAnswer where q.id = :questionId and s.id = :sessionId and s.owner.id = :ownerId")
    Optional<InterviewQuestion> findOwnedQuestion(@Param("questionId") Long questionId,
            @Param("sessionId") Long sessionId, @Param("ownerId") Long ownerId);

    @Query("select coalesce(max(q.questionOrder), 0) from InterviewQuestion q where q.interviewSession.id = :sessionId")
    int findMaxQuestionOrder(@Param("sessionId") Long sessionId);

    long countByInterviewSession_Id(Long sessionId);
}
