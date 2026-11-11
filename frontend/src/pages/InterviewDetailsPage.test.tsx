import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ApiError } from '../api/apiError'
import { interviewService } from '../api/interviewService'
import { questionService } from '../api/questionService'
import type { GeneratedQuestion, Interview, InterviewPractice, QuestionGenerationResponse } from '../api/types'
import InterviewDetailsPage from './InterviewDetailsPage'
import InterviewsPage from './InterviewsPage'

vi.mock('../api/interviewService', () => ({
  interviewService: {
    getInterviews: vi.fn(),
    getInterviewById: vi.fn(),
    updateInterview: vi.fn(),
    deleteInterview: vi.fn(),
  },
}))

vi.mock('../api/questionService', () => ({
  questionService: {
    getPracticeSession: vi.fn(),
    getQuestions: vi.fn(),
    generateQuestions: vi.fn(),
    savePracticeAnswer: vi.fn(),
    markQuestionCompleted: vi.fn(),
  },
}))

const interview: Interview = {
  id: 42,
  role: 'Product Designer',
  difficulty: 'INTERMEDIATE',
  interviewType: 'BEHAVIORAL',
  topic: 'Product strategy',
  status: 'CREATED',
  createdAt: '2026-11-01T12:30:00Z',
}

const existingQuestion: GeneratedQuestion = {
  id: 1,
  questionOrder: 1,
  questionText: 'How do you define a product strategy?',
  suggestedAnswer: 'A product strategy aligns customer needs to business outcomes.',
  difficulty: 'INTERMEDIATE',
  topic: 'Product strategy',
  evaluationCriteria: ['Connects strategy to customer needs'],
  expectedKeyConcepts: ['Customer value'],
  practiceAnswer: null,
  practiceAnswerUpdatedAt: null,
  completedAt: null,
}

const newlyGeneratedQuestion: GeneratedQuestion = {
  id: 2,
  questionOrder: 2,
  questionText: 'How would you prioritize competing product requests?',
  suggestedAnswer: 'I would compare impact, effort, and alignment with user needs.',
  difficulty: 'INTERMEDIATE',
  topic: 'Product strategy',
  evaluationCriteria: ['Explains prioritization tradeoffs'],
  expectedKeyConcepts: ['Impact', 'Effort'],
  practiceAnswer: null,
  practiceAnswerUpdatedAt: null,
  completedAt: null,
}

function practiceSession(questions: GeneratedQuestion[] = []): InterviewPractice {
  const completed = questions.filter((question) => question.completedAt).length
  return {
    session: interview,
    questions,
    progress: {
      status: questions.length === 0 ? 'CREATED' : completed === questions.length ? 'COMPLETED' : 'QUESTIONS_GENERATED',
      totalQuestions: questions.length,
      answeredQuestions: questions.filter((question) => question.practiceAnswer).length,
      completedQuestions: completed,
      progressPercent: questions.length ? Math.floor((completed * 100) / questions.length) : 0,
    },
  }
}

function renderDetailsPage() {
  return render(
    <MemoryRouter initialEntries={['/interviews/42']}>
      <Routes>
        <Route path="/interviews/:id" element={<InterviewDetailsPage />} />
        <Route path="/" element={<div>Dashboard home</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Interview details session actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(interviewService.getInterviews).mockResolvedValue([interview])
    vi.mocked(interviewService.getInterviewById).mockResolvedValue(interview)
    vi.mocked(questionService.getQuestions).mockResolvedValue([])
    vi.mocked(questionService.getPracticeSession).mockResolvedValue(practiceSession())
  })

  it('navigates from My Interviews to the matching session and back', async () => {
    const user = userEvent.setup()
    const question: GeneratedQuestion = {
      id: 7,
      questionOrder: 1,
      questionText: 'Tell me about a time you changed a product direction.',
      suggestedAnswer: 'Use a STAR story about new customer evidence.',
      difficulty: 'INTERMEDIATE',
      topic: 'Product strategy',
      evaluationCriteria: ['Explains the customer insight'],
      expectedKeyConcepts: ['User research', 'Tradeoffs'],
      practiceAnswer: null,
      practiceAnswerUpdatedAt: null,
      completedAt: null,
    }
    vi.mocked(questionService.getPracticeSession).mockResolvedValue(practiceSession([question]))

    render(
      <MemoryRouter initialEntries={['/interviews']}>
        <Routes>
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="/interviews/:id" element={<InterviewDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByText('1 question')
    await user.click(screen.getByRole('link', { name: 'View details' }))

    expect(await screen.findByRole('heading', { name: 'Product Designer' })).toBeInTheDocument()
    expect(screen.getAllByText('Product strategy')).toHaveLength(2)
    expect(screen.getAllByText('Tell me about a time you changed a product direction.')).toHaveLength(2)
    expect(screen.getByText('Explains the customer insight')).toBeInTheDocument()
    expect(screen.getByText('User research')).toBeInTheDocument()
    expect(interviewService.getInterviewById).toHaveBeenCalledWith(42)
    expect(questionService.getPracticeSession).toHaveBeenCalledWith(42)

    await user.click(screen.getByRole('link', { name: /back to interviews/i }))
    expect(await screen.findByRole('heading', { name: 'My Interviews' })).toBeInTheDocument()
  })

  it('generates the requested number, blocks duplicate clicks, preserves existing questions, and refreshes the list', async () => {
    const user = userEvent.setup()
    let completeGeneration!: (response: QuestionGenerationResponse) => void
    const generationResult = new Promise<QuestionGenerationResponse>((resolve) => { completeGeneration = resolve })
    vi.mocked(questionService.getPracticeSession)
      .mockResolvedValueOnce(practiceSession([existingQuestion]))
      .mockResolvedValueOnce(practiceSession([existingQuestion, newlyGeneratedQuestion]))
    vi.mocked(questionService.generateQuestions).mockReturnValue(generationResult)

    renderDetailsPage()
    await screen.findAllByText(existingQuestion.questionText)
    await user.selectOptions(screen.getByRole('combobox', { name: /number of questions to generate/i }), '3')

    const generateButton = screen.getByRole('button', { name: 'Generate more' })
    await user.click(generateButton)
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /generating/i }))
    expect(questionService.generateQuestions).toHaveBeenCalledTimes(1)
    expect(questionService.generateQuestions).toHaveBeenCalledWith(42, { numberOfQuestions: 3 })

    completeGeneration({ questions: [newlyGeneratedQuestion] })

    expect(await screen.findByRole('status')).toHaveTextContent('1 question generated successfully.')
    expect(await screen.findAllByText(newlyGeneratedQuestion.questionText)).toHaveLength(2)
    expect(screen.getAllByText(existingQuestion.questionText)).toHaveLength(2)
    expect(questionService.getPracticeSession).toHaveBeenCalledTimes(2)
    expect(questionService.getPracticeSession).toHaveBeenNthCalledWith(2, 42)
  })

  it.each([
    [new ApiError('Too many requests.', { kind: 'http', status: 429 }), 'The AI service is receiving too many requests. Wait a moment, then try again.'],
    [new ApiError('Timed out.', { kind: 'timeout' }), 'Question generation took longer than expected. You can try again in a moment.'],
    [new ApiError('The AI provider request failed.', { kind: 'http', status: 502 }), 'The AI provider request failed.'],
  ])('shows a useful generation error and leaves current questions intact', async (failure, expectedMessage) => {
    const user = userEvent.setup()
    vi.mocked(questionService.getPracticeSession).mockResolvedValue(practiceSession([existingQuestion]))
    vi.mocked(questionService.generateQuestions).mockRejectedValue(failure)

    renderDetailsPage()
    await screen.findAllByText(existingQuestion.questionText)
    await user.click(screen.getByRole('button', { name: 'Generate more' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(expectedMessage)
    expect(screen.getAllByText(existingQuestion.questionText)).toHaveLength(2)
    expect(questionService.getPracticeSession).toHaveBeenCalledTimes(1)
  })

  it('prepopulates the shared edit form, submits an update, and refreshes the displayed session', async () => {
    const user = userEvent.setup()
    const updated: Interview = { ...interview, role: 'Senior Product Designer', topic: 'Design systems' }
    vi.mocked(interviewService.updateInterview).mockResolvedValue(updated)

    renderDetailsPage()
    await screen.findByRole('heading', { name: 'Product Designer' })
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByLabelText(/job role/i)).toHaveValue('Product Designer')
    expect(screen.getByLabelText(/difficulty/i)).toHaveValue('INTERMEDIATE')
    expect(screen.getByLabelText(/interview type/i)).toHaveValue('BEHAVIORAL')
    expect(screen.getByLabelText(/^topic/i)).toHaveValue('Product strategy')

    await user.clear(screen.getByLabelText(/job role/i))
    await user.type(screen.getByLabelText(/job role/i), updated.role)
    await user.clear(screen.getByLabelText(/topic/i))
    await user.type(screen.getByLabelText(/topic/i), updated.topic)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(interviewService.updateInterview).toHaveBeenCalledWith(42, {
      role: updated.role,
      difficulty: 'INTERMEDIATE',
      interviewType: 'BEHAVIORAL',
      topic: updated.topic,
    }))
    expect(await screen.findByRole('status')).toHaveTextContent('Interview session updated successfully.')
    expect(screen.getByRole('heading', { name: updated.role })).toBeInTheDocument()
    expect(screen.getByText(updated.topic)).toBeInTheDocument()
  })

  it('validates edit fields before calling the update endpoint', async () => {
    const user = userEvent.setup()
    renderDetailsPage()
    await screen.findByRole('heading', { name: 'Product Designer' })
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText(/job role/i))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Job role is required.')
    expect(interviewService.updateInterview).not.toHaveBeenCalled()
  })

  it('shows an update API error without closing the edit form', async () => {
    const user = userEvent.setup()
    vi.mocked(interviewService.updateInterview).mockRejectedValue(new ApiError('Update failed.', { kind: 'http', status: 500 }))
    renderDetailsPage()
    await screen.findByRole('heading', { name: 'Product Designer' })
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Update failed.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Product Designer' })).toBeInTheDocument()
  })

  it('requires delete confirmation and navigates to the dashboard after deletion', async () => {
    const user = userEvent.setup()
    vi.mocked(interviewService.deleteInterview).mockResolvedValue()
    renderDetailsPage()
    await screen.findByRole('heading', { name: 'Product Designer' })

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const confirmation = screen.getByRole('alertdialog')
    expect(confirmation).toHaveTextContent('associated questions')
    expect(confirmation).toHaveTextContent('associated answers')
    expect(interviewService.deleteInterview).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(interviewService.deleteInterview).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Delete interview' }))

    expect(interviewService.deleteInterview).toHaveBeenCalledWith(42)
    expect(await screen.findByText('Dashboard home')).toBeInTheDocument()
  })

  it('shows a delete API error and keeps the interview page open', async () => {
    const user = userEvent.setup()
    vi.mocked(interviewService.deleteInterview).mockRejectedValue(new ApiError('Delete failed.', { kind: 'http', status: 500 }))
    renderDetailsPage()
    await screen.findByRole('heading', { name: 'Product Designer' })

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Delete interview' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Delete failed.')
    expect(screen.getByRole('heading', { name: 'Product Designer' })).toBeInTheDocument()
  })
})
