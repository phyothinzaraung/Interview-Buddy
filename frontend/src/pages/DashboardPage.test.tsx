import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { interviewService } from '../api/interviewService'
import type { Interview } from '../api/types'
import DashboardPage from './DashboardPage'

vi.mock('../api/interviewService', () => ({
  interviewService: {
    getInterviews: vi.fn(),
  },
}))

function interview(id: number, status: Interview['status'], createdAt: string): Interview {
  return {
    id,
    role: `Engineer ${id}`,
    topic: `Topic ${id}`,
    difficulty: 'INTERMEDIATE',
    interviewType: 'TECHNICAL',
    status,
    createdAt,
  }
}

function renderDashboard() {
  return render(<MemoryRouter><DashboardPage /></MemoryRouter>)
}

describe('Dashboard recent interviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders newest sessions across generated and completed statuses', async () => {
    vi.mocked(interviewService.getInterviews).mockResolvedValue([
      interview(1, 'CREATED', '2026-11-01T10:00:00Z'),
      interview(6, 'QUESTIONS_GENERATED', '2026-11-06T10:00:00Z'),
      interview(4, 'IN_PROGRESS', '2026-11-04T10:00:00Z'),
      interview(5, 'COMPLETED', '2026-11-05T10:00:00Z'),
      interview(3, 'CREATED', '2026-11-03T10:00:00Z'),
      interview(2, 'QUESTIONS_GENERATED', '2026-11-02T10:00:00Z'),
    ])

    renderDashboard()

    const recent = await screen.findByRole('region', { name: 'Recent interviews' })
    expect(within(recent).getAllByText('Engineer 6').length).toBeGreaterThan(0)
    expect(within(recent).getAllByText('Engineer 5').length).toBeGreaterThan(0)
    expect(within(recent).queryAllByText('Engineer 1')).toHaveLength(0)
    expect(within(recent).getAllByText('Questions ready').length).toBeGreaterThan(0)
    expect(within(recent).getAllByText('Completed').length).toBeGreaterThan(0)
  })

  it('shows a load error instead of presenting a failed request as an empty account', async () => {
    vi.mocked(interviewService.getInterviews).mockRejectedValue(new Error('Session expired. Sign in again.'))

    renderDashboard()

    expect(await screen.findByRole('heading', { name: 'We couldn’t load your interviews' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Session expired. Sign in again.')
    expect(screen.queryByRole('heading', { name: 'No interviews yet' })).not.toBeInTheDocument()
  })
})
