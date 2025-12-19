import { createClient } from '@/utils/supabase/server'
import CaseCard from '@/components/CaseCard'
import LoginForm from '@/components/LoginForm'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const casesResult = await supabase.from('cases').select('*').order('created_at', { ascending: false })
  const cases = casesResult.data || []

  let votedCaseIds = new Set()
  if (user) {
    const votesResult = await supabase.from('votes').select('case_id').eq('user_id', user.id)
    votedCaseIds = new Set(votesResult.data?.map(v => v.case_id))
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-10">
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-black tracking-tight text-white">
            VERDICTION <span className="text-blue-500">.AI</span>
          </h1>
          {user ? (
            <div className="text-sm text-right">
              <div className="text-slate-400">Agent</div>
              <div className="font-bold text-white">{user.email}</div>
            </div>
          ) : (
            <div className="text-sm text-yellow-500">Guest Mode</div>
          )}
        </header>

        {!user && <LoginForm />}

        <div className="space-y-4">
          {cases.map((c) => (
            <CaseCard
              key={c.id}
              caseData={c}
              hasVoted={votedCaseIds.has(c.id)}
            />
          ))}
          {cases.length === 0 && (
            <div className="text-center text-slate-500 mt-10">No active cases.</div>
          )}
        </div>
      </div>
    </main>
  )
}
