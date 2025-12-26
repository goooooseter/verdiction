import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export const runtime = "nodejs"

type VerdictPayload = {
  verdict: "ВИНОВЕН" | "НЕВИНОВЕН"
  p_guilty: number
  p_not_guilty: number
  why: string
}

function collectOutputText(responseJson: any): string {
  // Raw REST Responses API returns an `output` array with message items.
  const out = Array.isArray(responseJson?.output) ? responseJson.output : []
  const parts: string[] = []

  for (const item of out) {
    if (item?.type !== "message") continue
    if (item?.role !== "assistant") continue
    const content = Array.isArray(item?.content) ? item.content : []
    for (const c of content) {
      if (c?.type === "output_text" && typeof c?.text === "string") {
        parts.push(c.text)
      }
    }
  }

  // Some SDKs expose output_text, but we keep a fallback.
  if (!parts.length && typeof responseJson?.output_text === "string") return responseJson.output_text
  return parts.join("")
}

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1))
    }
    throw new Error("Model returned non-JSON output")
  }
}

async function loadCaseBundle(caseId: number) {
  const supabase = await createClient()

  const { data: caseRow, error: caseErr } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .single()

  if (caseErr) throw new Error(caseErr.message || "Не удалось загрузить кейс")

  // Optional: related events. We try a couple of common table names.
  const eventTables = ["case_events", "events"] as const
  let events: any[] = []

  for (const table of eventTables) {
    const { data, error } = await supabase.from(table).select("*").eq("case_id", caseId)
    if (!error && Array.isArray(data)) {
      events = data
      break
    }
  }

  // Sort if we have a timestamp-like field
  events.sort((a, b) => {
    const ta = new Date(a?.occurred_at || a?.created_at || 0).getTime()
    const tb = new Date(b?.occurred_at || b?.created_at || 0).getTime()
    return ta - tb
  })

  return { caseRow, events }
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY не задан на сервере" },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const caseId = Number(body?.caseId)
    const preprompt = String(body?.preprompt || "").trim()

    if (!Number.isFinite(caseId) || caseId <= 0) {
      return NextResponse.json({ error: "Некорректный caseId" }, { status: 400 })
    }
    if (!preprompt) {
      return NextResponse.json({ error: "Пустой препромпт" }, { status: 400 })
    }

    const { caseRow, events } = await loadCaseBundle(caseId)

    const system =
      "Ты — экспертный судья, который выносит *симуляционный* вердикт только по материалам дела ниже. " +
      "Если данных недостаточно, прямо скажи об этом и сделай осторожный вывод. " +
      "Не выдумывай факты. Вердикт строго бинарный: ВИНОВЕН или НЕВИНОВЕН. " +
      "Ответ верни строго в JSON по заданной схеме."

    const user = [
      `ПРЕПРОМПТ (от пользователя):\n${preprompt}`,
      "\n\nМАТЕРИАЛЫ ДЕЛА:",
      `Кейс #${caseRow.id}: ${caseRow.title}`,
      caseRow.category ? `Категория: ${caseRow.category}` : null,
      `Описание: ${caseRow.description}`,
      caseRow.intrigue ? `Ключевая интрига: ${caseRow.intrigue}` : null,
      events?.length
        ? `\nСобытия (${events.length}):\n${events
            .map((e: any, idx: number) => {
              const dt = e?.occurred_at || e?.created_at || ""
              const label = e?.title || e?.name || e?.event || `Событие ${idx + 1}`
              const desc = e?.description || e?.details || e?.text || ""
              return `- ${dt ? `[${dt}] ` : ""}${label}${desc ? ` — ${desc}` : ""}`
            })
            .join("\n")}`
        : "\nСобытия: (нет данных/таблицы событий не подключены)",
      "\n\nСформируй ответ в JSON." // важно для JSON/structured mode
    ]
      .filter(Boolean)
      .join("\n")

    // Use Responses API (recommended) and Structured Outputs (json_schema) when supported.
    const schema = {
      type: "object",
      properties: {
        verdict: { type: "string", enum: ["ВИНОВЕН", "НЕВИНОВЕН"] },
        p_guilty: { type: "number", minimum: 0, maximum: 1 },
        p_not_guilty: { type: "number", minimum: 0, maximum: 1 },
        why: { type: "string" },
      },
      required: ["verdict", "p_guilty", "p_not_guilty", "why"],
      additionalProperties: false,
    } as const

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // You can override this in env if you want: e.g. gpt-5-mini / gpt-5.2
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        max_output_tokens: 900,
        text: {
          format: {
            type: "json_schema",
            name: "verdict",
            strict: true,
            schema,
          },
        },
      }),
    })

    const openaiJson = await openaiRes.json().catch(() => null)
    if (!openaiRes.ok) {
      const msg =
        openaiJson?.error?.message ||
        `OpenAI API error (${openaiRes.status})`
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    const text = collectOutputText(openaiJson)
    const parsed = safeJsonParse(text) as VerdictPayload

    // Small sanity: keep probabilities consistent.
    const pg = Math.min(1, Math.max(0, Number(parsed.p_guilty)))
    const png = Math.min(1, Math.max(0, Number(parsed.p_not_guilty)))
    const sum = pg + png
    const normalized = sum > 0 ? { p_guilty: pg / sum, p_not_guilty: png / sum } : { p_guilty: 0.5, p_not_guilty: 0.5 }

    const data: VerdictPayload = {
      verdict: parsed.verdict,
      p_guilty: normalized.p_guilty,
      p_not_guilty: normalized.p_not_guilty,
      why: String(parsed.why || "").trim(),
    }

    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    )
  }
}
