'use server'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function submitVote(caseId: number, prediction: boolean) {
  const supabase = await createClient()

  // Вместо insert вызываем нашу SQL-функцию (RPC)
  const { data, error } = await supabase.rpc('vote_with_price', {
    p_case_id: caseId,
    p_prediction: prediction,
    p_base: 100
  })

  // Обработка системных ошибок Supabase (например, сеть упала)
  if (error) {
    console.error("RPC Error:", error)
    return { error: 'Ошибка соединения с сервером' }
  }

  // Обработка логических ошибок из нашей функции (например, "Нет денег")
  // data придет в виде JSON объекта, который мы сформировали в SQL
  if (data && data.error) {
    return { error: data.error }
  }

  // Если всё ок
  revalidatePath('/') // <-- ЭТО ВАЖНО: Обновляет баланс в шапке сайта без перезагрузки
  return { success: true, price: data?.price }
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
  return { success: true, message: 'Проверьте Ваш email!' }
}

// 1. Отправка кода
export async function sendOtp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  // Отправляем письмо. Supabase сам сгенерирует 6-значный код.
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    // options не нужны, так как мы не делаем редирект, мы ждем код
  })

  if (error) return { error: error.message }
  return { success: true }
}

// 2. Проверка кода
export async function verifyCode(email: string, code: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  })

  if (error) {
    return { error: 'Неверный код или срок действия истек' }
  }

  // Если всё ок, куки сессии установятся автоматически
  revalidatePath('/')
  return { success: true }
}
