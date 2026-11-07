import { apiClient } from './client'
import type {
  GeneratedQuestion,
  GenerateQuestionsRequest,
  QuestionGenerationResponse,
} from './types'

function questionsPath(interviewId: number): string {
  return `/api/interviews/${interviewId}/questions`
}

export const questionService = {
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
