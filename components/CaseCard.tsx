"use client"

import { useState, useEffect } from 'react'
import { submitVote } from '@/app/actions/vote'
import { toast } from 'sonner'
import { Gavel, Clock, AlertTriangle, ShieldAlert, TrendingUp, CheckCircle2, Lock } from 'lucide-react'
import AIVerdictPanel from '@/components/AIVerdictPanel'
import MarketOrderbook from '@/components/MarketOrderbook'

interface CaseData {
  id: number
  title: string
  description: string
  category: string
  intrigue: string | null
  deadline: string
}

interface CaseProps {
  caseData: CaseData // Поправил any на нормальный тип
  hasVoted: boolean
}

export default function CaseCard({ caseData, hasVoted }: CaseProps) {
  const [loading, setLoading] = useState(false)
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

      const declension = (number: number, titles: string[]) => {  
        const cases = [2, 0, 1, 1, 1, 2];  
        return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];  
      }

      if (days > 0) {
        return { 
            text: `${days} ${declension(days, ['день', 'дня', 'дней'])}`, 
            urgent: days < 2, 
            expired: false 
        }
      }

      return { 
          text: `${hours} ${declension(hours, ['час', 'часа', 'часов'])}`, 
          urgent: true, 
          expired: false 
      }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000)
    return () => clearInterval(timer)
  }, [caseData.deadline])
  // ----------------------

  const handleVote = async (prediction: boolean) => {
    setLoading(true)
    // Важно: здесь мы хардкодим сумму 100, так как в интерфейсе пока нет выбора суммы
    const result = await submitVote(caseData.id, prediction)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Голос принят! Баланс XP обновлен.')
    }
  }

  // ВРЕМЕННО: Псевдо-случайная статистика (потом заменим на реальную из БД)
  const pseudoRandom = (caseData.id * 13) % 100
  const votesFor = 40 + (pseudoRandom % 40) // От 40% до 80%
  const votesAgainst = 100 - votesFor

  if (!timeLeft) return null

  // Определяем стили рамки: если истекло — рамка не светится
  const cardStyle = timeLeft.expired 
    ? "glass-panel rounded-2xl p-6 mb-6 relative overflow-hidden group border-slate-800/50"
    : "glass-panel rounded-2xl p-6 mb-6 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group"

  return (
    <div className={cardStyle}>
      
      {/* Верхний бейдж */}
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
        Кейс #{caseData.id}: {caseData.title}
      </h3>

      {/* Контент */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Нарратив */}
          <div className="border-l-2 border-slate-700 pl-4 mb-5">
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              {caseData.description}
            </p>
            
            {/* Интрига */}
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

          {/* Рыночный консенсус */}
          <div className="mb-6">
            <MarketOrderbook caseId={caseData.id} />
          </div>

          {/* ЛОГИКА ОТОБРАЖЕНИЯ КНОПОК (Исправлено!) */}
          {timeLeft.expired ? (
            
            // ВАРИАНТ 1: Время вышло
            <div className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-center gap-2 text-slate-400 font-medium">
                <Lock size={16} />
                <span>Прием прогнозов завершен</span>
            </div>

          ) : ( // <--- ИСПРАВЛЕНО: Если НЕ голосовал, показываем кнопки
            
            // ВАРИАНТ 2: Кнопки голосования
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

          )}
        </div>

        {/* Правая панель с выводом AI */}
        <div className="lg:col-span-1">
          <AIVerdictPanel caseId={caseData.id} />
        </div>
      </div>
    </div>
  )
}