import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. Создаем начальный ответ
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // ВАЖНО: Обновляем куки и в Запросе (чтобы сервер видел прямо сейчас)
            request.cookies.set(name, value)
            
            // ...и в Ответе (чтобы браузер сохранил на будущее)
            response = NextResponse.next({
              request,
            })
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 2. Используем getUser вместо getSession (безопаснее для middleware)
  await supabase.auth.getUser()

  return response
}