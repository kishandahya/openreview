import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import z from "zod"
import * as Pipeline from "@openreview/core/pipeline"
import { LLM } from "@openreview/core"
import type { Review } from "@openreview/core/types"

const Body = z.object({
  content: z.string().min(1).max(10000),
})

function system(rev: Review): string {
  const parts = [
    `You are an AI code review assistant. You have reviewed PR "${rev.pr?.title ?? rev.url}".`,
    rev.summary ? `Summary: ${rev.summary.text}` : "",
    rev.findings.length > 0
      ? `Findings:\n${rev.findings.map((f) => `- [${f.severity}] ${f.title} in ${f.file}:${f.start}`).join("\n")}`
      : "No issues found.",
    "Answer questions about this PR concisely and helpfully.",
  ]
  return parts.filter(Boolean).join("\n\n")
}

export function chat(): Hono {
  const app = new Hono()

  // Send chat message
  app.post("/:id/chat", async (c) => {
    const rev = Pipeline.get(c.req.param("id"))
    if (!rev) return c.json({ error: "not found" }, 404)

    const raw = await c.req.json()
    const result = Body.safeParse(raw)
    if (!result.success) return c.json({ error: "Invalid chat body", details: result.error.issues }, 400)

    rev.messages.push({
      role: "user",
      content: result.data.content,
      timestamp: Date.now(),
    })
    return c.json({ ok: true })
  })

  // SSE stream for chat response
  app.get("/:id/chat/stream", (c) => {
    const rev = Pipeline.get(c.req.param("id"))
    if (!rev) return c.json({ error: "not found" }, 404)

    return streamSSE(c, async (sse) => {
      const llm = await LLM.model(rev.config)
      const msgs = rev.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))

      let full = ""
      const gen = LLM.stream({
        model: llm,
        system: system(rev),
        messages: msgs,
      })

      for await (const chunk of gen) {
        full += chunk
        await sse.writeSSE({ event: "text", data: chunk })
      }

      rev.messages.push({
        role: "assistant",
        content: full,
        timestamp: Date.now(),
      })

      await sse.writeSSE({ event: "done", data: "{}" })
    })
  })

  return app
}
