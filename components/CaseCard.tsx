"use client"

import { useTransition } from 'react'
import { submitVote } from '@/app/actions/vote'
import { toast, Toaster } from 'sonner'
import { Case } from '@/types/database'

export default function CaseCard({ caseData, hasVoted }: { caseData: Case, hasVoted: boolean }) {
    const [isPending, startTransition] = useTransition()

    const onVote = (prediction: boolean) => {
        startTransition(async () => {
            const result = await submitVote(caseData.id, prediction)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Ваш прогноз записан! +10 XP")
            }
        })
    }

    return (
        <div className="border border-slate-700 p-6 rounded-xl bg-slate-900 text-white shadow-lg mb-6">
            <div className="flex justify-between items-center mb-4">
                <span className="bg-yellow-600 text-xs px-2 py-1 rounded text-white font-bold">АКТИВНОЕ ДЕЛО</span>
                <span className="text-slate-400 text-sm">#Case-{caseData.id}</span>
            </div>

            <h3 className="text-2xl font-bold mb-3">{caseData.title}</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">{caseData.description}</p>

            <div className="flex gap-4">
                {hasVoted ? (
                    <div className="w-full bg-slate-800 p-4 rounded-lg text-center text-yellow-400 font-medium border border-slate-700">
                        ✅ Ваш голос принят. Ожидайте решения суда.
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => onVote(false)}
                            disabled={isPending}
                            className="flex-1 py-3 px-4 rounded-lg border border-red-500 text-red-400 hover:bg-red-950 transition disabled:opacity-50"
                        >
                            Невиновен
                        </button>
                        <button
                            onClick={() => onVote(true)}
                            disabled={isPending}
                            className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50"
                        >
                            Виновен
                        </button>
                    </>
                )}
            </div>
            <Toaster theme="dark" position="bottom-center" />
        </div>
    )
}