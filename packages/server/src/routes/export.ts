import { Hono } from "hono"
import * as Pipeline from "@openreview/core/pipeline"
import type { Review } from "@openreview/core/types"

function markdown(rev: Review): string {
  const lines = [
    `# Code Review: ${rev.pr?.title ?? rev.url}`,
    "",
    `**Status**: ${rev.status}`,
    `**Verdict**: ${rev.summary?.verdict ?? "pending"}`,
    "",
    rev.summary?.text ?? "",
    "",
    "## Findings",
    "",
  ]

  for (const f of rev.findings) {
    lines.push(`### ${f.title}`)
    lines.push(`- **Severity**: ${f.severity}`)
    lines.push(`- **File**: ${f.file}:${f.start}-${f.end}`)
    lines.push(`- **Confidence**: ${(f.confidence * 100).toFixed(0)}%`)
    lines.push("")
    lines.push(f.description)
    if (f.fix) {
      lines.push("")
      lines.push("**Suggested fix:**")
      lines.push("```")
      lines.push(f.fix.code)
      lines.push("```")
      lines.push(f.fix.explanation)
    }
    lines.push("")
  }

  return lines.join("\n")
}

export function exp(): Hono {
  const app = new Hono()

  app.get("/:id/export", (c) => {
    const rev = Pipeline.get(c.req.param("id"))
    if (!rev) return c.json({ error: "not found" }, 404)

    const format = c.req.query("format") ?? "json"
    if (format === "md") {
      return c.text(markdown(rev), 200, { "Content-Type": "text/markdown" })
    }
    return c.json(rev)
  })

  return app
}
