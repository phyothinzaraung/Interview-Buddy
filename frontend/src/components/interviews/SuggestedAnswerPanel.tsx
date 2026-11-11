import { useState } from 'react'
import { Eye, EyeOff, Sparkles } from 'lucide-react'

type SuggestedAnswerPanelProps = { answer: string | null }

function renderAnswer(answer: string) {
  const parts = answer.split(/```([\w+#.-]*)\n([\s\S]*?)```/g)
  const content = []
  for (let index = 0; index < parts.length; index += 3) {
    const prose = parts[index]
    if (prose?.trim()) {
      content.push(
        <p key={`text-${index}`} className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{prose.trim()}</p>,
      )
    }
    if (index + 2 < parts.length) {
      const language = parts[index + 1]
      const code = parts[index + 2]
      content.push(
        <div key={`code-${index}`} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          {language && <div className="border-b border-slate-800 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{language}</div>}
          <pre className="overflow-x-auto p-4 text-xs leading-6 text-slate-100"><code>{code.trim()}</code></pre>
        </div>,
      )
    }
  }
  return content
}

export default function SuggestedAnswerPanel({ answer }: SuggestedAnswerPanelProps) {
  const [visible, setVisible] = useState(true)

  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/50" aria-labelledby="suggested-answer-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 px-4 py-3 sm:px-5">
        <h3 id="suggested-answer-heading" className="flex items-center gap-2 text-xs font-bold text-indigo-950">
          <Sparkles size={15} className="text-brand-600" /> AI suggested answer
        </h3>
        <button type="button" onClick={() => setVisible((current) => !current)} aria-expanded={visible}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-4 focus:ring-indigo-100">
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}{visible ? 'Hide answer' : 'Show answer'}
        </button>
      </div>
      {visible && (
        <div className="space-y-4 p-4 sm:p-5">
          {answer ? renderAnswer(answer) : <p className="text-sm leading-6 text-slate-600">A suggested answer is not available for this question. New questions include role-specific guidance.</p>}
        </div>
      )}
    </section>
  )
}
