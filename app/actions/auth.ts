'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signOut() {
  const supabase = await createClient()

  // 1. Удаляем сессию в Supabase (и чистим куки)
  await supabase.auth.signOut()

  // 2. Сбрасываем кэш главной страницы, чтобы она перерисовалась как для гостя
  revalidatePath('/', 'layout')

  // 3. Перенаправляем пользователя на главную (или на страницу входа)
  redirect('/')
}