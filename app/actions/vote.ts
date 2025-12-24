'use server'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function submitVote(caseId: number, prediction: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Please login first' }
  }

  const { error } = await supabase
    .from('votes')
    .insert({
      user_id: user.id,
      case_id: caseId,
      prediction: prediction
    })

  if (error) {
    if (error.code === '23505') return { error: 'Already voted' }
    return { error: 'Server error' }
  }

  revalidatePath('/')
  return { success: true }
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const headersList = await headers()
  const origin = headersList.get('origin')

  const callbackUrl = origin 
    ? `${origin}/auth/callback` 
    : 'https://verdiction.vercel.app/auth/callback' // Фолбэк на прод, если origin не найден

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: callbackUrl,
    }
  })

  if (error) return { error: error.message }
  return { success: true, message: 'Check your email!' }
}
