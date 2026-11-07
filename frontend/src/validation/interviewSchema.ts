import { z } from 'zod'
import { DIFFICULTIES, INTERVIEW_TYPES } from '../api/types'

export const interviewSchema = z.object({
  role: z.string({ error: 'Job role is required.' })
    .trim()
    .min(1, 'Job role is required.')
    .max(100, 'Job role must be 100 characters or fewer.'),
  difficulty: z.enum(DIFFICULTIES, { error: 'Select a difficulty.' }),
  interviewType: z.enum(INTERVIEW_TYPES, { error: 'Select an interview type.' }),
  topic: z.string({ error: 'Topic is required.' })
    .trim()
    .min(1, 'Topic is required.')
    .max(100, 'Topic must be 100 characters or fewer.'),
})

export type InterviewFormValues = z.infer<typeof interviewSchema>
