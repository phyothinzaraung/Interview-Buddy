/** Values mirror com.interviewbuddy.session.model.Difficulty. */
export const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

/** Values mirror com.interviewbuddy.session.model.InterviewType. */
export const INTERVIEW_TYPES = ['TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN'] as const
export type InterviewType = (typeof INTERVIEW_TYPES)[number]

/** Values mirror com.interviewbuddy.session.model.InterviewStatus. */
export type InterviewStatus = 'CREATED' | 'QUESTIONS_GENERATED' | 'IN_PROGRESS' | 'COMPLETED'

/** Request DTO: CreateInterviewSessionRequest (used by create and update). */
export interface InterviewRequest {
  role: string
  difficulty: Difficulty
  interviewType: InterviewType
  topic: string
}

/** Response DTO: InterviewSessionResponse. createdAt is an ISO-8601 instant string in JSON. */
export interface Interview {
  id: number
  role: string
  difficulty: Difficulty
  interviewType: InterviewType
  topic: string
  status: InterviewStatus
  createdAt: string
}

/** Request DTO: GenerateQuestionsRequest. The backend accepts values from 1 through 10. */
export interface GenerateQuestionsRequest {
  numberOfQuestions: number
}

/** Response DTO: GeneratedQuestionResponse. */
export interface GeneratedQuestion {
  id: number
  questionOrder: number
  questionText: string
  suggestedAnswer: string | null
  difficulty: Difficulty
  topic: string
  evaluationCriteria: string[]
  expectedKeyConcepts: string[]
  practiceAnswer: string | null
  practiceAnswerUpdatedAt: string | null
  completedAt: string | null
}

/** Response DTO: QuestionGenerationResponse. */
export interface QuestionGenerationResponse {
  questions: GeneratedQuestion[]
}

/** Response DTO: PracticeAnswerResponse. */
export interface PracticeAnswer {
  questionId: number
  answerText: string | null
  updatedAt: string | null
  completedAt: string | null
}

/** Response DTO: PracticeProgressResponse. */
export interface PracticeProgress {
  status: InterviewStatus
  totalQuestions: number
  answeredQuestions: number
  completedQuestions: number
  progressPercent: number
}

/** Response DTO: InterviewPracticeResponse. */
export interface InterviewPractice {
  session: Interview
  questions: GeneratedQuestion[]
  progress: PracticeProgress
}
