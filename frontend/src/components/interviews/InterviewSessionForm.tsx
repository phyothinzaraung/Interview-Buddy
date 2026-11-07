import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { DIFFICULTIES, INTERVIEW_TYPES } from '../../api/types'
import type { InterviewRequest } from '../../api/types'
import { interviewSchema, type InterviewFormValues } from '../../validation/interviewSchema'

type InterviewSessionFormProps = {
  initialValues?: Partial<InterviewRequest>
  idPrefix: string
  submitLabel: string
  submittingLabel: string
  errorMessage?: string | null
  onCancel: () => void
  onSubmit: (values: InterviewRequest) => Promise<void>
}

const difficultyLabels = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' } as const
const interviewTypeLabels = { TECHNICAL: 'Technical', BEHAVIORAL: 'Behavioral', SYSTEM_DESIGN: 'System design' } as const

export default function InterviewSessionForm({
  initialValues,
  idPrefix,
  submitLabel,
  submittingLabel,
  errorMessage,
  onCancel,
  onSubmit,
}: InterviewSessionFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      role: initialValues?.role ?? '',
      topic: initialValues?.topic ?? '',
      difficulty: initialValues?.difficulty,
      interviewType: initialValues?.interviewType,
    },
  })

  const submit: SubmitHandler<InterviewFormValues> = async (values) => onSubmit(values)
  const roleId = `${idPrefix}-role`
  const difficultyId = `${idPrefix}-difficulty`
  const interviewTypeId = `${idPrefix}-interview-type`
  const topicId = `${idPrefix}-topic`

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
      <div className="p-5 sm:p-7">
        {errorMessage && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{errorMessage}</div>}

        <fieldset disabled={isSubmitting} className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor={roleId} className="block text-xs font-semibold text-slate-700">Job role <span className="text-rose-500">*</span></label>
            <input id={roleId} type="text" autoComplete="organization-title" placeholder="e.g. Senior Product Designer" aria-invalid={Boolean(errors.role)} aria-describedby={errors.role ? `${roleId}-error` : `${roleId}-hint`} {...register('role')} className={`mt-2 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${errors.role ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-brand-500 focus:ring-indigo-100'}`} />
            {errors.role ? <p id={`${roleId}-error`} role="alert" className="mt-1.5 text-[11px] text-rose-600">{errors.role.message}</p> : <p id={`${roleId}-hint`} className="mt-1.5 text-[11px] text-slate-400">Up to 100 characters.</p>}
          </div>

          <div>
            <label htmlFor={difficultyId} className="block text-xs font-semibold text-slate-700">Difficulty <span className="text-rose-500">*</span></label>
            <select id={difficultyId} aria-invalid={Boolean(errors.difficulty)} aria-describedby={errors.difficulty ? `${difficultyId}-error` : undefined} {...register('difficulty')} className={`mt-2 h-11 w-full rounded-xl border bg-white px-3.5 text-sm outline-none transition focus:ring-4 ${errors.difficulty ? 'border-rose-300 text-slate-600 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 text-slate-700 focus:border-brand-500 focus:ring-indigo-100'}`}>
              <option value="">Select difficulty</option>
              {DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{difficultyLabels[difficulty]}</option>)}
            </select>
            {errors.difficulty && <p id={`${difficultyId}-error`} role="alert" className="mt-1.5 text-[11px] text-rose-600">{errors.difficulty.message}</p>}
          </div>

          <div>
            <label htmlFor={interviewTypeId} className="block text-xs font-semibold text-slate-700">Interview type <span className="text-rose-500">*</span></label>
            <select id={interviewTypeId} aria-invalid={Boolean(errors.interviewType)} aria-describedby={errors.interviewType ? `${interviewTypeId}-error` : undefined} {...register('interviewType')} className={`mt-2 h-11 w-full rounded-xl border bg-white px-3.5 text-sm outline-none transition focus:ring-4 ${errors.interviewType ? 'border-rose-300 text-slate-600 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 text-slate-700 focus:border-brand-500 focus:ring-indigo-100'}`}>
              <option value="">Select interview type</option>
              {INTERVIEW_TYPES.map((type) => <option key={type} value={type}>{interviewTypeLabels[type]}</option>)}
            </select>
            {errors.interviewType && <p id={`${interviewTypeId}-error`} role="alert" className="mt-1.5 text-[11px] text-rose-600">{errors.interviewType.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor={topicId} className="block text-xs font-semibold text-slate-700">Topic <span className="text-rose-500">*</span></label>
            <input id={topicId} type="text" placeholder="e.g. Product strategy and prioritization" aria-invalid={Boolean(errors.topic)} aria-describedby={errors.topic ? `${topicId}-error` : `${topicId}-hint`} {...register('topic')} className={`mt-2 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${errors.topic ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-brand-500 focus:ring-indigo-100'}`} />
            {errors.topic ? <p id={`${topicId}-error`} role="alert" className="mt-1.5 text-[11px] text-rose-600">{errors.topic.message}</p> : <p id={`${topicId}-hint`} className="mt-1.5 text-[11px] text-slate-400">Up to 100 characters.</p>}
          </div>
        </fieldset>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting && <LoaderCircle size={16} className="animate-spin" />}{isSubmitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}
