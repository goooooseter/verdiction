import { createClient } from '@/utils/supabase/server'
import CaseCard from '@/components/CaseCard'
import LoginForm from '@/components/LoginForm'
import { BrainCircuit, Zap, ShieldAlert, LogOut, Wallet } from 'lucide-react' // Иконки для лого
import { signOut } from '@/app/actions/auth'

export const dynamic = "force-dynamic";

// Типизация под вашу таблицу
interface Profile {
  username: string
  level: string    // 'Novice', 'Expert' и т.д.
  xp: number
  credits: number  // Это и есть Reputation
}

export default async function Home() {
  const supabase = await createClient()
  
  // Получаем пользователя
  const { data: { user } } = await supabase.auth.getUser()

// 1. Получаем профиль
  let profile: Profile | null = null
  
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    profile = data
  }

  // 2. Получаем кейсы
  const { data: casesData, error } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching cases:", error)
    return <div className="p-10 text-red-500">Ошибка: {error.message}</div>
  }

  // 3. Сортировка (Неголосованные вверх)
  const cases = [...(casesData || [])]
  const votedCaseIds = new Set<number>()

  if (user) {
    const { data: votes } = await supabase
      .from('votes')
      .select('case_id')
      .eq('user_id', user.id)
    
    votes?.forEach(vote => votedCaseIds.add(vote.case_id))
  }

  cases.sort((a, b) => {
    const aVoted = votedCaseIds.has(a.id)
    const bVoted = votedCaseIds.has(b.id)
    if (aVoted === bVoted) return 0 
    if (!aVoted && bVoted) return -1 
    return 1 
  })

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Хедер */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                <BrainCircuit className="text-white" size={28} />
            </div>
            <div>
                <h1 className="text-2xl font-black tracking-widest text-white leading-none">VERDICTION</h1>
                <p className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase">AI-Driven Justice</p>
            </div>
          </div>

          {user && profile ? (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex items-center gap-4 min-w-[260px]">
                {/* Аватар */}
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg shrink-0">
                    {profile.username?.[0].toUpperCase() || user.email?.[0].toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                    {/* Первая строка: Email + Выход */}
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-blue-400 text-xs font-bold truncate pr-2">
                            {profile.username || user.email}
                        </span>
                        <form action={signOut}>
                            <button type="submit" className="text-slate-500 hover:text-red-400 transition-colors p-0.5"><LogOut size={14} /></button>
                        </form>
                    </div>
                    
                    {/* Вторая строка: Статы */}
                    <div className="flex items-center gap-2 text-[10px] font-mono leading-none">
                        {/* Уровень */}
                        <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                           {profile.level}
                        </span>
                        
                        {/* Разделитель */}
                        <span className="text-slate-600">|</span>

                        {/* XP */}
                        <span className="text-slate-400">XP: {profile.xp}</span>

                        {/* Разделитель */}
                        <span className="text-slate-600">|</span>

                        {/* Репутация (Credits из базы) */}
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                            REP: {profile.credits}
                        </span>
                    </div>
                </div>
            </div>
          ) : !user ? (
            <div className="text-sm text-slate-500 font-mono">ГОСТЕВОЙ РЕЖИМ</div>
          ) : (
            <div className="text-white animate-pulse text-sm">Загрузка профиля...</div>
          )}
        </header>

        {!user && <div className="mb-12"><LoginForm /></div>}

        <div className="mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
            <Zap className="text-blue-500 fill-blue-500" size={20} />
            <h2 className="text-xl font-bold text-white">Активные Кейсы</h2>
        </div>

        <div className="flex flex-col gap-6">
          {cases.map((singleCase) => {
            const isVoted = votedCaseIds.has(singleCase.id)
            return (
                <div key={singleCase.id} className={isVoted ? "opacity-60 hover:opacity-100 transition-opacity" : ""}>
                    <CaseCard 
                        caseData={singleCase} 
                        hasVoted={isVoted} 
                    />
                </div>
            )
          })}
        </div>

        {cases.length === 0 && (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                Пока нет активных дел.
            </div>
        )}

      </div>
    </main>
  )
}