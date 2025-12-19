import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Получаем параметры из ссылки (тот самый code)
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Если есть параметр "next", перенаправим туда после входа, иначе на главную
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    // Самый важный момент: меняем код на сессию
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Если всё ок — перенаправляем на сайт уже авторизованными
      const forwardedHost = request.headers.get('x-forwarded-host') 
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // Локально перенаправляем просто на localhost
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        // На продакшене учитываем реальный домен
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Если ошибка — возвращаем на главную с сообщением
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}