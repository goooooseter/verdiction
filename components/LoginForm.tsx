"use client"

import { login } from '@/app/actions/vote'
import { toast } from 'sonner'
import { ArrowRight, Lock } from 'lucide-react'

export default function LoginForm() {
  const handleLogin = async (formData: FormData) => {
    const result = await login(formData)
    if (result?.error) toast.error(result.error)
    else if (result?.success) toast.success(result.message)
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 mb-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock size={18} className="text-blue-500" /> 
                Доступ к Терминалу
            </h2>
            <p className="text-slate-400 text-sm mt-1">
                Введите служебный email для получения магической ссылки.
            </p>
        </div>
      
        <form action={handleLogin} className="flex gap-2 w-full md:w-auto">
            <input 
            name="email" 
            type="email" 
            placeholder="agent@verdiction.ai" 
            className="flex-1 bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors min-w-[250px]"
            required 
            />
            <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
            Войти <ArrowRight size={16} />
            </button>
        </form>
      </div>
    </div>
  )
}
