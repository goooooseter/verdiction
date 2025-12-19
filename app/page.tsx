import { createClient } from '@/utils/supabase/server'
import CaseCard from '@/components/CaseCard'
import LoginForm from '@/components/LoginForm'
import { BrainCircuit, Zap, ShieldAlert } from 'lucide-react' // Иконки для лого

export default async function Home() {
  const supabase = await createClient()
  
  // Получаем пользователя
  const { data: { user } } = await supabase.auth.getUser()

  // Получаем кейсы
  const casesResult = await supabase.from('cases').select('*').order('created_at', { ascending: false })
  const cases = casesResult.data || []

  // Проверяем, где пользователь уже голосовал
  let votedCaseIds = new Set()
  if (user) {
    const votesResult = await supabase.from('votes').select('case_id').eq('user_id', user.id)
    votedCaseIds = new Set(votesResult.data?.map(v => v.case_id))
  }

  return (
    <main className="min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Хедер / Шапка */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          
          {/* Логотип */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                <BrainCircuit className="text-white" size={28} />
            </div>
            <div>
                <h1 className="text-2xl font-black tracking-widest text-white leading-none">
                    VERDICTION
                </h1>
                <p className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase">
                    AI-Driven Justice
                </p>
            </div>
          </div>

          {/* Карточка профиля (как справа вверху на прототипе) */}
          {user ? (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex items-center gap-4 min-w-[240px]">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg">
                    {user.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <span className="text-blue-400 text-xs font-bold">@Agent_{user.email?.split('@')[0]}</span>
                        <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded border border-yellow-500/30">Lvl 3</span>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-slate-400">
                        <span>Точность: <b className="text-white">84%</b></span>
                        <span className="text-blue-500 font-bold">5,500 XP</span>
                    </div>
                </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Гостевой режим</div>
          )}
        </header>

        {/* Форма входа (если не вошел) */}
        {!user && <LoginForm />}

        {/* Секция Активных кейсов */}
        <div className="mb-4 flex items-center gap-2">
            <Zap className="text-blue-500 fill-blue-500" size={20} />
            <h2 className="text-xl font-bold text-white">Активные Кейсы</h2>
        </div>

        <div className="space-y-6">
          {cases.map((c) => (
            <CaseCard 
              key={c.id} 
              caseData={c} 
              hasVoted={votedCaseIds.has(c.id)} 
            />
          ))}
          
          {cases.length === 0 && (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl text-slate-500">
              Система сканирует новые дела...
            </div>
          )}
        </div>

        {/* Нижний предупреждающий баннер (как на картинке) */}
        <div className="mt-12 border border-red-500/20 bg-red-950/10 rounded-xl p-4 flex gap-4 items-start">
            <ShieldAlert className="text-red-500 shrink-0" />
            <div>
                <h4 className="text-red-500 font-bold text-sm mb-1">Внимание: Требование активности</h4>
                <p className="text-red-400/60 text-xs">
                    Ваш Уровень Экспертизы III требует еженедельного прогноза. Неактивность приведет к снижению веса вашего голоса в ИИ.
                </p>
            </div>
        </div>

      </div>
    </main>
  )
}