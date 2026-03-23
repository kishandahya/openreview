import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { Config } from "@openreview/core/types"
import * as Pipeline from "@openreview/core/pipeline"

export function review(): Hono {
  const app = new Hono()

  // Start a review
  app.post("/", async (c) => {
    const body = await c.req.json<{ url: string; config?: Record<string, unknown> }>()
    if (!body.url) return c.json({ error: "url is required" }, 400)

    const parsed = Config.safeParse(body.config ?? {})
    if (!parsed.success) return c.json({ error: "Invalid config", details: parsed.error.issues }, 400)

    const id = await Pipeline.run(body.url, parsed.data)
    return c.json({ id })
  })

  // Get session state
  app.get("/:id", (c) => {
    const rev = Pipeline.get(c.req.param("id"))
    if (!rev) return c.json({ error: "not found" }, 404)
    return c.json(rev)
  })

  // SSE stream for pipeline events
  app.get("/:id/stream", (c) => {
    const sid = c.req.param("id")
    const rev = Pipeline.get(sid)
    if (!rev) return c.json({ error: "not found" }, 404)

    return streamSSE(c, async (sse) => {
      let resolve: (() => void) | undefined
      const done = new Promise<void>((r) => { resolve = r })

      const unsub = Pipeline.subscribe(sid, (e) => {
        sse.writeSSE({ event: e.type, data: JSON.stringify(e) }).catch(() => {})
        if (e.type === "done" || e.type === "error") resolve?.()
      })

      if (rev.status === "done") {
        unsub()
        await sse.writeSSE({ event: "done", data: JSON.stringify({ type: "done" }) })
        return
      }
      if (rev.status === "error") {
        unsub()
        await sse.writeSSE({ event: "error", data: JSON.stringify({ type: "error", message: "Review failed" }) })
        return
      }

      const timer = setInterval(() => {
        sse.writeSSE({ event: "heartbeat", data: "{}" }).catch(() => {})
      }, 10000)

      await done
      clearInterval(timer)
      unsub()
    })
  })

  return app
}
