import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { interviewService } from '../api/interviewService'
import { questionService } from '../api/questionService'
import type { GeneratedQuestion, Interview, InterviewRequest } from '../api/types'
import CreateInterviewPage from './CreateInterviewPage'
import InterviewDetailsPage from './InterviewDetailsPage'
import InterviewsPage from './InterviewsPage'

vi.mock('../api/interviewService', () => ({
  interviewService: {
    createInterview: vi.fn(),
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

let sessions: Interview[]
let questionsBySession: Record<number, GeneratedQuestion[]>

function renderWorkflow(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/interviews" element={<InterviewsPage />} />
        <Route path="/interviews/new" element={<CreateInterviewPage />} />
        <Route path="/interviews/:id" element={<InterviewDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('My Interviews end-to-end frontend workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessions = []
    questionsBySession = {}

    vi.mocked(interviewService.createInterview).mockImplementation(async (request: InterviewRequest) => {
      const created: Interview = {
        id: 101,
        ...request,
        status: 'CREATED',
        createdAt: '2026-11-06T12:00:00Z',
      }
      sessions.push(created)
      questionsBySession[created.id] = []
      return created
    })
    vi.mocked(interviewService.getInterviews).mockImplementation(async () => [...sessions])
    vi.mocked(interviewService.getInterviewById).mockImplementation(async (id) => {
      const found = sessions.find((session) => session.id === id)
      if (!found) throw new Error('Not found')
      return found
    })
    vi.mocked(questionService.getQuestions).mockImplementation(async (id) => [...(questionsBySession[id] ?? [])])
    vi.mocked(questionService.getPracticeSession).mockImplementation(async (id) => {
      const session = sessions.find((item) => item.id === id)
      const questions = [...(questionsBySession[id] ?? [])]
      const completed = questions.filter((question) => question.completedAt).length
      return {
        session: session!,
        questions,
        progress: {
          status: questions.length === 0 ? 'CREATED' : completed === questions.length ? 'COMPLETED' : 'QUESTIONS_GENERATED',
          totalQuestions: questions.length,
          answeredQuestions: questions.filter((question) => question.practiceAnswer).length,
          completedQuestions: completed,
          progressPercent: questions.length ? Math.floor((completed * 100) / questions.length) : 0,
        },
      }
    })
    vi.mocked(questionService.generateQuestions).mockImplementation(async (id, request) => {
      const generated = Array.from({ length: request.numberOfQuestions }, (_, index): GeneratedQuestion => ({
        id: 200 + index,
        questionOrder: (questionsBySession[id]?.length ?? 0) + index + 1,
        questionText: `Generated question ${index + 1} for ${id}`,
        suggestedAnswer: 'A role-specific sample answer.',
        difficulty: 'INTERMEDIATE',
        topic: 'Product strategy',
        evaluationCriteria: ['Clear prioritization'],
        expectedKeyConcepts: ['Impact'],
        practiceAnswer: null,
        practiceAnswerUpdatedAt: null,
        completedAt: null,
      }))
      questionsBySession[id] = [...(questionsBySession[id] ?? []), ...generated]
      return { questions: generated }
    })
  })

  it('creates, lists, opens, generates, returns, and reloads with persisted question status', async () => {
    const user = userEvent.setup()
    const view = renderWorkflow('/interviews/new')

    await user.type(screen.getByLabelText(/job role/i), 'Product Designer')
    await user.selectOptions(screen.getByLabelText(/difficulty/i), 'INTERMEDIATE')
    await user.selectOptions(screen.getByLabelText(/interview type/i), 'BEHAVIORAL')
    await user.type(screen.getByLabelText(/^topic/i), 'Product strategy')
    await user.click(screen.getByRole('button', { name: 'Create interview' }))

    expect(await screen.findByRole('heading', { name: 'Product Designer' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'No questions yet' })).toBeInTheDocument()
    expect(interviewService.createInterview).toHaveBeenCalledWith({
      role: 'Product Designer',
      difficulty: 'INTERMEDIATE',
      interviewType: 'BEHAVIORAL',
      topic: 'Product strategy',
    })

    await user.selectOptions(screen.getByRole('combobox', { name: /number of questions to generate/i }), '2')
    await user.click(screen.getByRole('button', { name: 'Generate Questions' }))
    expect(await screen.findAllByText('Generated question 1 for 101')).toHaveLength(2)
    expect(screen.getAllByText('Generated question 2 for 101')).toHaveLength(2)

    await user.click(screen.getByRole('link', { name: /back to interviews/i }))
    expect(await screen.findByRole('heading', { name: 'My Interviews' })).toBeInTheDocument()
    expect(await screen.findByText('2 questions')).toBeInTheDocument()
    expect(screen.getByText('Questions Ready')).toBeInTheDocument()

    view.unmount()
    renderWorkflow('/interviews')
    expect(await screen.findByText('2 questions')).toBeInTheDocument()
    expect(screen.getByText('Questions Ready')).toBeInTheDocument()
    expect(questionService.getPracticeSession).toHaveBeenCalledWith(101)
  })

  it('shows the empty list state when there are no sessions', async () => {
    renderWorkflow('/interviews')
    expect(await screen.findByRole('heading', { name: 'Your interviews will appear here' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create your first interview/i })).toHaveAttribute('href', '/interviews/new')
  })

  it('shows a loading state while the session list request is pending', async () => {
    let resolveSessions!: (value: Interview[]) => void
    vi.mocked(interviewService.getInterviews).mockReturnValue(new Promise((resolve) => { resolveSessions = resolve }))
    renderWorkflow('/interviews')

    expect(screen.getByRole('status', { name: 'Loading interviews' })).toHaveAttribute('aria-busy', 'true')
    resolveSessions([])
    expect(await screen.findByRole('heading', { name: 'Your interviews will appear here' })).toBeInTheDocument()
  })

  it('shows a retry action when the details question list fails', async () => {
    const user = userEvent.setup()
    const session: Interview = { ...interviewTemplate(), id: 101 }
    sessions = [session]
    vi.mocked(questionService.getPracticeSession)
      .mockRejectedValueOnce(new Error('Question list unavailable'))
      .mockResolvedValueOnce({
        session,
        questions: [],
        progress: {
          status: 'CREATED',
          totalQuestions: 0,
          answeredQuestions: 0,
          completedQuestions: 0,
          progressPercent: 0,
        },
      })
    renderWorkflow('/interviews/101')

    expect(await screen.findByRole('heading', { name: session.role })).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Question list unavailable')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'No questions yet' })).toBeInTheDocument()
  })

  it('shows a retryable error when the interview list request fails', async () => {
    const user = userEvent.setup()
    vi.mocked(interviewService.getInterviews)
      .mockRejectedValueOnce(new Error('Service unavailable'))
      .mockResolvedValueOnce([])
    renderWorkflow('/interviews')

    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Your interviews will appear here' })).toBeInTheDocument()
    await waitFor(() => expect(interviewService.getInterviews).toHaveBeenCalledTimes(2))
  })
})

function interviewTemplate(): Interview {
  return {
    id: 101,
    role: 'Product Designer',
    difficulty: 'INTERMEDIATE',
    interviewType: 'BEHAVIORAL',
    topic: 'Product strategy',
    status: 'CREATED',
    createdAt: '2026-11-06T12:00:00Z',
  }
}
