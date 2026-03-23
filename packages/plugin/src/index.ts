import { tool } from "@opencode-ai/plugin"
import * as Pipeline from "@openreview/core/pipeline"

export default tool({
  description: `Review a GitHub pull request using AI analysis.

Runs a 6-phase review pipeline: context loading, copy/move detection, semantic grouping, bug detection (4-pass), auto-fix generation, scope drift analysis, and summary verdict.

Returns structured findings with severity, file locations, and suggested fixes.

Requires ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable.`,
  args: {
    url: tool.schema.string().describe("GitHub PR URL (e.g. https://github.com/owner/repo/pull/123) or shorthand (owner/repo#123)"),
    provider: tool.schema.enum(["anthropic", "openai"]).optional().describe("LLM provider (default: anthropic)"),
    model: tool.schema.string().optional().describe("Model name override"),
  },
  async execute(args) {
    const cfg = { provider: args.provider ?? "anthropic" as const, model: args.model }
    const sid = await Pipeline.run(args.url, cfg)

    // Wait for pipeline completion
    await new Promise<void>((resolve, reject) => {
      const unsub = Pipeline.subscribe(sid, (e) => {
        if (e.type === "done") { unsub(); resolve() }
        if (e.type === "error") { unsub(); reject(new Error(e.message)) }
      })
      // Safety timeout
      setTimeout(() => { unsub(); reject(new Error("Review timed out after 5 minutes")) }, 300000)
    })

    const review = Pipeline.get(sid)
    if (!review) return "Review session not found"

    // Format as structured markdown
    const lines: string[] = []

    lines.push(`# Code Review: ${review.pr?.title ?? review.url}`)
    lines.push("")
    lines.push(`**Verdict**: ${review.summary?.verdict ?? "pending"} | **Confidence**: ${review.summary?.confidence ? (review.summary.confidence * 100).toFixed(0) + "%" : "N/A"}`)
    lines.push("")

    if (review.summary?.text) {
      lines.push(review.summary.text)
      lines.push("")
    }

    if (review.findings.length > 0) {
      lines.push("## Findings")
      lines.push("")
      for (const f of review.findings) {
        lines.push(`### [${f.severity.toUpperCase()}] ${f.title}`)
        lines.push(`- **File**: ${f.file}:${f.start}-${f.end}`)
        lines.push(`- **Category**: ${f.category} | **Confidence**: ${(f.confidence * 100).toFixed(0)}%`)
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
    }

    if (review.groups.length > 0) {
      lines.push("## Semantic Groups")
      lines.push("")
      for (const g of review.groups) {
        lines.push(`**${g.title}**: ${g.description}`)
        lines.push(`Files: ${g.files.map((f: { path: string }) => f.path).join(", ")}`)
        lines.push("")
      }
    }

    return lines.join("\n")
  },
})
