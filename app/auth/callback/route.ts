import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    // СОЗДАЕМ КЛИЕНТ ВРУЧНУЮ (Это ключевой момент!)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // В Route Handler это обычно не падает, но try/catch нужен для безопасности
            }
          },
        },
      }
    )
    
    // Обмениваем код на сессию
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Успех! Перенаправляем пользователя
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Если ошибка или нет кода
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}