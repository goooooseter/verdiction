'use client'

import { useEffect, useState } from 'react'
import { X, Info } from 'lucide-react'

export default function AboutProjectModal() {
  const [open, setOpen] = useState(false)

  // Закрытие по Esc + блокировка скролла фона
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* Кнопка */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-colors"
      >
        <Info size={14} />
        О проекте
      </button>

      {/* Overlay + modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onMouseDown={() => setOpen(false)} // клик по фону закрывает
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()} // клик внутри не закрывает
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-white text-lg font-black tracking-wide">Verdiction MVP</h3>
                <p className="text-slate-400 text-xs mt-1">
                  AI-Driven Justice • прототип системы голосования по кейсам
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                Здесь пользователи голосуют по кейсам, формируя рыночные ожидания и сигнал консенсуса.
              </p>
              <p>
                Внутри: авторизация, список дел с дедлайнами, учёт голосов и панель AI-аналитики.
              </p>
              <p className="text-slate-400 text-xs pt-2 border-t border-slate-800">
                Закрыть: Esc / клик по фону / кнопка X
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
