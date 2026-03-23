import type { Config } from "../types/config"
import type { Review } from "../types/review"
import type { PipelineEvent } from "../types/pipeline"
import { model } from "../llm/provider"
import * as Context from "./context"
import * as CopyMove from "./copy-move"
import * as Semantic from "./semantic"
import * as Bugs from "./bugs"
import * as Fix from "./fix"
import * as Drift from "./drift"
import * as Summary from "./summary"

const sessions = new Map<string, Review>()
const listeners = new Map<string, Set<(e: PipelineEvent) => void>>()

const TTL = 30 * 60 * 1000
const CAP = 50

function evict() {
  const now = Date.now()
  for (const [sid, rev] of sessions) {
    if ((rev.status === "done" || rev.status === "error") && now - rev.updated > TTL) {
      sessions.delete(sid)
      listeners.delete(sid)
    }
  }
  if (sessions.size > CAP) {
    const sorted = [...sessions.entries()].sort((a, b) => a[1].updated - b[1].updated)
    const excess = sessions.size - CAP
    for (let i = 0; i < excess; i++) {
      sessions.delete(sorted[i]![0])
      listeners.delete(sorted[i]![0])
    }
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function get(sid: string): Review | undefined {
  return sessions.get(sid)
}

export function subscribe(sid: string, cb: (e: PipelineEvent) => void): () => void {
  if (!listeners.has(sid)) listeners.set(sid, new Set())
  listeners.get(sid)!.add(cb)
  return () => listeners.get(sid)?.delete(cb)
}

export async function run(
  url: string,
  cfg: Config,
  emit?: (e: PipelineEvent) => void,
): Promise<string> {
  evict()
  const sid = uid()
  const now = Date.now()

  const review: Review = {
    id: sid,
    status: "pending",
    url,
    config: cfg,
    diffs: [],
    copyMoves: [],
    findings: [],
    groups: [],
    messages: [],
    created: now,
    updated: now,
  }

  sessions.set(sid, review)

  const broadcast = (e: PipelineEvent) => {
    emit?.(e)
    listeners.get(sid)?.forEach((cb) => cb(e))
  }

  // Run pipeline async (fire-and-forget)
  ;(async () => {
    review.status = "running"
    review.updated = Date.now()

    const { pr, diffs } = await Context.run(url, process.env.GITHUB_TOKEN, broadcast)
    review.pr = pr
    review.diffs = diffs
    review.updated = Date.now()

    review.copyMoves = CopyMove.run(diffs, broadcast)

    const llm = await model(cfg)
    review.groups = await Semantic.run(llm, diffs, broadcast)
    review.updated = Date.now()

    review.findings = await Bugs.run(llm, diffs, broadcast)
    review.updated = Date.now()

    await Fix.run(llm, review.findings, diffs, broadcast)
    review.updated = Date.now()

    const flags = await Drift.run(llm, pr, diffs, broadcast)
    review.findings = [...review.findings, ...flags]
    review.updated = Date.now()

    review.summary = await Summary.run(llm, review.findings, broadcast)
    review.status = "done"
    review.updated = Date.now()

    broadcast({ type: "done" })
  })().catch((err) => {
    review.status = "error"
    review.updated = Date.now()
    broadcast({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    })
  })

  return sid
}
