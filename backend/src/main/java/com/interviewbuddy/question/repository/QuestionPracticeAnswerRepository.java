package com.interviewbuddy.question.repository;

import com.interviewbuddy.question.model.QuestionPracticeAnswer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionPracticeAnswerRepository extends JpaRepository<QuestionPracticeAnswer, Long> {
    Optional<QuestionPracticeAnswer> findByQuestion_Id(Long questionId);
}
