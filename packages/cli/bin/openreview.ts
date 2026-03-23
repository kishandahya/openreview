#!/usr/bin/env bun
import { create } from "@openreview/server"
import * as Pipeline from "@openreview/core/pipeline"
import { Config } from "@openreview/core/types"

const args = process.argv.slice(2)
const url = args.find((a) => !a.startsWith("--"))
const headless = args.includes("--headless")
const port = parseInt(args[args.indexOf("--port") + 1] ?? "3847", 10)
const provider = args[args.indexOf("--provider") + 1] as "anthropic" | "openai" | undefined
const mod = args[args.indexOf("--model") + 1]

if (!url) {
  console.log("Usage: openreview <pr-url> [--headless] [--port N] [--provider anthropic|openai] [--model name]")
  process.exit(1)
}

const cfg = Config.parse({ provider: provider ?? "anthropic", model: mod })

if (headless) {
  // Headless mode: run pipeline, print JSON, exit
  const sid = await Pipeline.run(url, cfg)

  await new Promise<void>((resolve, reject) => {
    const unsub = Pipeline.subscribe(sid, (e) => {
      if (e.type === "progress") console.error(`[${e.phase}] ${e.message}`)
      if (e.type === "done") { unsub(); resolve() }
      if (e.type === "error") { unsub(); reject(new Error(e.message)) }
    })
    setTimeout(() => { unsub(); reject(new Error("Timed out after 5 minutes")) }, 300000)
  })

  const rev = Pipeline.get(sid)
  if (!rev) process.exit(1)

  console.log(JSON.stringify({
    verdict: rev.summary?.verdict ?? "unknown",
    confidence: rev.summary?.confidence ?? 0,
    summary: rev.summary?.text ?? "",
    findings: rev.findings.map((f) => ({
      id: f.id,
      title: f.title,
      severity: f.severity,
      category: f.category,
      file: f.file,
      start: f.start,
      end: f.end,
      confidence: f.confidence,
    })),
    counts: rev.summary?.counts,
  }, null, 2))

  process.exit(rev.summary?.verdict === "pass" ? 0 : 1)
}

// Interactive mode: start server, open browser
const app = create()
const sid = await Pipeline.run(url, cfg)

const server = Bun.serve({
  port,
  fetch: app.fetch,
})

console.log(`OpenReview running at http://localhost:${port}/review/${sid}`)

// Open browser
const open = await import("open").then((m) => m.default).catch(() => null)
if (open) await open(`http://localhost:${port}/review/${sid}`)
