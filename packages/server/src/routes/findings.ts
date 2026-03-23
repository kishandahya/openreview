import { Hono } from "hono"
import * as Pipeline from "@openreview/core/pipeline"

export function findings(): Hono {
  const app = new Hono()

  app.patch("/:id/findings/:fid", async (c) => {
    const rev = Pipeline.get(c.req.param("id"))
    if (!rev) return c.json({ error: "not found" }, 404)

    const fid = c.req.param("fid")
    const body = await c.req.json<{ resolved: boolean }>()
    const finding = rev.findings.find((f) => f.id === fid)
    if (!finding) return c.json({ error: "finding not found" }, 404)

    finding.resolved = body.resolved
    return c.json({ ok: true })
  })

  return app
}
