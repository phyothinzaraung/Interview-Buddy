import { apiClient } from './client'
import type {
  GeneratedQuestion,
  GenerateQuestionsRequest,
  InterviewPractice,
  PracticeAnswer,
  PracticeProgress,
  QuestionGenerationResponse,
} from './types'

function questionsPath(interviewId: number): string {
  return `/api/interviews/${interviewId}/questions`
}

export const questionService = {
  async getPracticeSession(interviewId: number): Promise<InterviewPractice> {
    const response = await apiClient.get<InterviewPractice>(`/api/interviews/${interviewId}/practice`)
    return response.data
  },

  async getPracticeProgress(interviewId: number): Promise<PracticeProgress> {
    const response = await apiClient.get<PracticeProgress>(`/api/interviews/${interviewId}/practice/progress`)
    return response.data
  },

  async getPracticeAnswer(interviewId: number, questionId: number): Promise<PracticeAnswer> {
    const response = await apiClient.get<PracticeAnswer>(`${questionsPath(interviewId)}/${questionId}/answer`)
    return response.data
  },

  async savePracticeAnswer(interviewId: number, questionId: number, answerText: string): Promise<PracticeAnswer> {
    const response = await apiClient.put<PracticeAnswer>(`${questionsPath(interviewId)}/${questionId}/answer`, { answerText })
    return response.data
  },

  async markQuestionCompleted(interviewId: number, questionId: number): Promise<PracticeAnswer> {
    const response = await apiClient.post<PracticeAnswer>(`${questionsPath(interviewId)}/${questionId}/complete`)
    return response.data
  },

  async generateQuestions(
    interviewId: number,
    request: GenerateQuestionsRequest,
  ): Promise<QuestionGenerationResponse> {
    const response = await apiClient.post<QuestionGenerationResponse>(
      `${questionsPath(interviewId)}/generate`,
      request,
      { timeout: 120_000 },
    )
    return response.data
  },

  async getQuestions(interviewId: number): Promise<GeneratedQuestion[]> {
    const response = await apiClient.get<GeneratedQuestion[]>(questionsPath(interviewId))
    return response.data
  },
}
