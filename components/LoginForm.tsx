"use client"

import { useState } from 'react'
import { sendOtp, verifyCode } from '@/app/actions/vote' // Импортируем новые функции
import { toast } from 'sonner'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)

  // Шаг 1: Отправка Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData()
    formData.append('email', email)
    
    const result = await sendOtp(formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      setStep('code')
      toast.success('Код отправлен на почту!')
    }
  }

  // Шаг 2: Проверка Кода
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await verifyCode(email, code)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Успешный вход!')
      // Перезагрузка страницы, чтобы обновить интерфейс (появится аватар)
      window.location.reload()
    }
  }

  return (
    <div className="max-w-md mx-auto bg-slate-900/50 border border-slate-800 p-8 rounded-2xl backdrop-blur-sm">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Вход в систему</h3>
        <p className="text-slate-400 text-sm">
          {step === 'email' 
            ? 'Введите email, чтобы получить код доступа' 
            : `Введите 6-значный код, отправленный на ${email}`}
        </p>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Получить код <ArrowRight size={18} /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="123456" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors tracking-widest font-mono text-center text-lg"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Войти'}
          </button>
          
          <button 
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-slate-500 text-sm hover:text-slate-300 mt-2"
          >
            Назад к вводу почты
          </button>
        </form>
      )}
    </div>
  )
}