"use client"

import { useState } from "react"
import { BrainCircuit, Loader2, RefreshCcw, AlertTriangle, Gavel } from "lucide-react"

type VerdictPayload = {
  verdict: "ВИНОВЕН" | "НЕВИНОВЕН"
  p_guilty: number
  p_not_guilty: number
  why: string
}

const DEFAULT_PREPROMPT =
  "Дай мне свой вывод по этому судебному делу, как если бы ты был экспертным судьёй: бинарный вердикт (виновен/не виновен) и почему. Используй только материалы дела, не выдумывай факты."

export default function AIVerdictPanel({ caseId }: { caseId: number }) {
  const [preprompt, setPreprompt] = useState(DEFAULT_PREPROMPT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<VerdictPayload | null>(null)

  const run = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, preprompt }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || "Не удалось получить вывод")

      setData(json.data as VerdictPayload)
    } catch (e: any) {
      setError(e?.message || "Ошибка")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const badge =
    data?.verdict === "ВИНОВЕН"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : data?.verdict === "НЕВИНОВЕН"
        ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
        : "bg-slate-700/40 text-slate-300 border-slate-600"

  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/10">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-blue-400" />
          <div>
            <div className="text-sm font-extrabold text-white leading-tight">AI-судья</div>
            <div className="text-[11px] text-slate-400">Экспертный вывод по материалам дела</div>
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="shrink-0 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-2"
          title="Сформировать вывод"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
          {loading ? "Думаю…" : "Запрос"}
        </button>
      </div>

      <div className={`mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-black ${badge}`}>
        <Gavel size={12} />
        {data ? `Вердикт: ${data.verdict}` : "Вердикт: —"}
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-200 text-xs">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Ошибка</div>
            <div className="text-rose-200/80">{error}</div>
          </div>
        </div>
      )}

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Виновен</div>
              <div className="text-sm font-black text-emerald-300">{Math.round(data.p_guilty * 100)}%</div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Невиновен</div>
              <div className="text-sm font-black text-rose-300">{Math.round(data.p_not_guilty * 100)}%</div>
            </div>
          </div>

          <pre className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-[11px] leading-relaxed text-slate-200 font-mono whitespace-pre-wrap">
{`Вердикт: ${data.verdict}

Почему так:
${data.why}`}
          </pre>
        </>
      ) : (
        <div className="text-xs text-slate-400">
          Нажми <span className="text-slate-200 font-bold">«Запрос»</span>, чтобы получить вывод.
        </div>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-[11px] text-slate-400 hover:text-slate-200 transition-colors">
          Настроить препромпт
        </summary>
        <div className="mt-2">
          <textarea
            value={preprompt}
            onChange={(e) => setPreprompt(e.target.value)}
            rows={4}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <div className="mt-2 text-[10px] text-slate-500">
            Подсказка: не запускай OpenAI прямо из браузера — делай это через серверный API (как здесь),
            чтобы ключ не утёк.
          </div>
        </div>
      </details>
    </div>
  )
}
