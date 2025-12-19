"use client"

import { login } from '@/app/actions/vote'
import { toast } from 'sonner'

export default function LoginForm() {
  const handleLogin = async (formData: FormData) => {
    const result = await login(formData)

    if (result?.error) {
      toast.error(result.error)
    } else if (result?.success) {
      toast.success(result.message)
    }
  }

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8">
      <h2 className="text-xl font-bold mb-2">Login Access</h2>
      <p className="text-slate-400 mb-4 text-sm">
        Enter Email to get a Magic Link.
      </p>

      <form action={handleLogin} className="flex gap-2">
        <input
          name="email"
          type="email"
          placeholder="name@company.com"
          className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
          required
        />
        <button
          type="submit"
          className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-slate-200"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}
