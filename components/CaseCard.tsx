"use client"

import { useState } from 'react'
import { submitVote } from '@/app/actions/vote'
import { toast } from 'sonner'
import { Gavel, Clock, AlertTriangle, ShieldAlert, TrendingUp } from 'lucide-react'

interface CaseProps {
  caseData: any
  hasVoted: boolean
}

export default function CaseCard({ caseData, hasVoted }: CaseProps) {
  const [loading, setLoading] = useState(false)

  const handleVote = async (prediction: boolean) => {
    setLoading(true)
    const result = await submitVote(caseData.id, prediction)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Голос принят! Репутация обновлена.')
    }
  }

  // Эмуляция статистики (в реальном проекте брать из БД)
  const votesFor = 65
  const votesAgainst = 35

  return (
    <div className="glass-panel rounded-2xl p-6 mb-6 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
      
      {/* Верхний бейдж "Активный кейс" или Таймер */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
            <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1">
                <Gavel size={12} /> Гражданское право
            </span>
            <span className="bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/20 flex items-center gap-1">
                <Clock size={12} /> 3 дня до конца
            </span>
        </div>
      </div>

      {/* Заголовок */}
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
        Кейс #{caseData.id.toString().padStart(3, '0')}: {caseData.title}
      </h3>

      {/* Блок Нарратива */}
      <div className="border-l-2 border-slate-700 pl-4 mb-5">
        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          {caseData.description}
        </p>
        
        {/* Блок "Интрига" как на скриншоте */}
        <div className="bg-violet-500/10 border border-violet-500/20 p-3 rounded-lg flex gap-3 items-start">
            <ShieldAlert className="text-violet-400 shrink-0 mt-0.5" size={18} />
            <div>
                <span className="text-violet-300 font-bold text-sm block mb-0.5">Ключевая интрига:</span>
                <p className="text-violet-200/80 text-xs">
                    Был ли доступ удаленным? Это коренным образом изменит ход дела и распределение ответственности.
                </p>
            </div>
        </div>
      </div>

      {/* Рыночный консенсус (Полоска) */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">
            <span>Консенсус рынка</span>
            <span>Обновлено: 12:45</span>
        </div>
        
        <div className="h-8 w-full bg-slate-800 rounded-md flex overflow-hidden relative">
            {/* Зеленая часть */}
            <div style={{ width: `${votesFor}%` }} className="bg-emerald-500 flex items-center justify-start pl-3 text-[10px] font-black text-emerald-950 tracking-widest">
                ВИНОВЕН ({votesFor}%)
            </div>
            {/* Красная часть */}
            <div style={{ width: `${votesAgainst}%` }} className="bg-rose-500 flex items-center justify-end pr-3 text-[10px] font-black text-rose-950 tracking-widest flex-1">
                НЕВИНОВЕН ({votesAgainst}%)
            </div>
            
            {/* Разделитель посередине */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-900 z-10 transform -translate-x-1/2"></div>
        </div>
      </div>

      {/* Кнопки голосования */}
      {!hasVoted ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleVote(true)}
            disabled={loading}
            className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/50 text-emerald-400 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group/btn"
          >
            <TrendingUp size={18} className="group-hover/btn:animate-bounce" /> ВИНОВЕН
          </button>
          
          <button
            onClick={() => handleVote(false)}
            disabled={loading}
            className="bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/50 text-rose-400 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            НЕВИНОВЕН
          </button>
        </div>
      ) : (
        <div className="text-center p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-400 text-sm">
          Ваш голос принят. Ожидайте решения суда.
        </div>
      )}

      {/* Предупреждение о рисках */}
      <div className="mt-4 flex items-center gap-2 text-[10px] text-red-400/60 font-medium">
        <AlertTriangle size={12} />
        Ваш риск: 100 Кредитов Аналитики
      </div>
    </div>
  )
}