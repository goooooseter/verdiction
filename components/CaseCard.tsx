"use client"

import { useState, useEffect } from 'react'
import { submitVote } from '@/app/actions/vote'
import { toast } from 'sonner'
import { Gavel, Clock, AlertTriangle, ShieldAlert, TrendingUp, CheckCircle2 } from 'lucide-react'
import AIVerdictPanel from '@/components/AIVerdictPanel'

interface CaseData {
  id: number
  title: string
  description: string
  category: string
  intrigue: string | null
  deadline: string
}

interface CaseProps {
  caseData: any
  hasVoted: boolean
}

export default function CaseCard({ caseData, hasVoted }: CaseProps) {
  const [loading, setLoading] = useState(false)
  const [localVoted, setLocalVoted] = useState(hasVoted) // Локальное состояние, чтобы UI обновлялся мгновенно
  const [timeLeft, setTimeLeft] = useState<{ text: string; urgent: boolean; expired: boolean } | null>(null)

  // --- ЛОГИКА ТАЙМЕРА ---
  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadline = new Date(caseData.deadline).getTime()
      const now = new Date().getTime()
      const diff = deadline - now

      if (diff <= 0) {
        return { text: 'Завершено', urgent: false, expired: true }
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      // Хелпер для склонения (1 день, 2 дня, 5 дней)
      const declension = (number: number, titles: string[]) => {  
        const cases = [2, 0, 1, 1, 1, 2];  
        return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];  
      }

      if (days > 0) {
        return { 
            text: `${days} ${declension(days, ['день', 'дня', 'дней'])}`, 
            urgent: days < 2, // Срочно, если меньше 2 дней
            expired: false 
        }
      }

      return { 
          text: `${hours} ${declension(hours, ['час', 'часа', 'часов'])}`, 
          urgent: true, // Всегда срочно, если остались часы
          expired: false 
      }
    }

    setTimeLeft(calculateTimeLeft())
    // Обновляем таймер каждую минуту, чтобы цифры менялись
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000)
    return () => clearInterval(timer)
  }, [caseData.deadline])
  // ----------------------

  const handleVote = async (prediction: boolean) => {
    setLoading(true)
    const result = await submitVote(caseData.id, prediction)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Голос принят! Баланс XP обновлен.')
      setLocalVoted(true)
    }
  }

  // ВРЕМЕННО: Генерируем "случайную" статистику на основе ID кейса, 
  // чтобы карточки выглядели по-разному.
  // В будущем сюда нужно передавать реальные count(*) из таблицы votes.
  const pseudoRandom = (caseData.id * 13) % 100
  const votesFor = 40 + (pseudoRandom % 40) // От 40% до 80%
  const votesAgainst = 100 - votesFor

  if (!timeLeft) return null

  return (
    <div className="glass-panel rounded-2xl p-6 mb-6 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
      
      {/* Верхний бейдж "Активный кейс" или Таймер */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
            <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1">
                <Gavel size={12} /> {caseData.category}
            </span>
            {!timeLeft.expired ? (
                <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1
                    ${timeLeft.urgent 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                    <Clock size={12} /> {timeLeft.text} до конца
                </span>
            ) : (
                <span className="bg-slate-700/50 text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Голосование закрыто
                </span>
            )}
        </div>
      </div>

      {/* Заголовок */}
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
        Кейс #{caseData.id.toString().padStart(3, '0')}: {caseData.title}
      </h3>

      {/* Основной контент + панель AI-судьи */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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
                        {caseData.intrigue}
                    </p>
                </div>
            </div>
          </div>

          {/* Рыночный консенсус (Полоска) */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                <span>Консенсус рынка</span>
                <span>{caseData.id}</span>
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
      {!localVoted ? (
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
            Ваш риск: 100 XP
          </div>
        </div>

        {/* Правая панель с выводом AI */}
        <div className="lg:col-span-1">
          <AIVerdictPanel caseId={caseData.id} />
        </div>
      </div>
    </div>
  )
}