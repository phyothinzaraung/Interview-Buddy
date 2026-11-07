import { apiClient } from './client'
import type { Interview, InterviewRequest } from './types'

const interviewsPath = '/api/interviews'

export const interviewService = {
  async createInterview(request: InterviewRequest): Promise<Interview> {
    const response = await apiClient.post<Interview>(interviewsPath, request)
    return response.data
  },

  async getInterviews(): Promise<Interview[]> {
    const response = await apiClient.get<Interview[]>(interviewsPath)
    return response.data
  },

  async getInterviewById(id: number): Promise<Interview> {
    const response = await apiClient.get<Interview>(`${interviewsPath}/${id}`)
    return response.data
  },

  async updateInterview(id: number, request: InterviewRequest): Promise<Interview> {
    const response = await apiClient.put<Interview>(`${interviewsPath}/${id}`, request)
    return response.data
  },

  async deleteInterview(id: number): Promise<void> {
    await apiClient.delete<void>(`${interviewsPath}/${id}`)
  },
}
