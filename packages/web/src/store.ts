import { createStore } from "solid-js/store"

export interface Finding {
  id: string
  title: string
  description: string
  file: string
  start: number
  end: number
  category: "bug" | "flag"
  confidence: number
  severity: "severe" | "non-severe" | "investigate" | "informational"
  fix?: { code: string; explanation: string }
  resolved: boolean
}

export interface Group {
  title: string
  description: string
  files: Array<{ path: string; additions: number; deletions: number }>
  order: number
}

export interface PRMeta {
  owner: string
  repo: string
  number: number
  title: string
  body: string
  status: "open" | "closed" | "merged"
  head: string
  base: string
  author: string
  labels: string[]
  checks?: { passed: number; total: number }
  reviewers: string[]
}

export interface Diff {
  file: string
  before: string
  after: string
  additions: number
  deletions: number
  status: "added" | "modified" | "deleted" | "renamed"
}

export interface Summary {
  verdict: "pass" | "fail"
  confidence: number
  text: string
  counts: {
    severe: number
    nonSevere: number
    investigate: number
    informational: number
    flags: number
  }
}

export interface State {
  status: "idle" | "running" | "done" | "error"
  pr: PRMeta | undefined
  diffs: Diff[]
  findings: Finding[]
  groups: Group[]
  summary: Summary | undefined
  progress: string[]
  error: string | undefined
}

export function createReviewStore() {
  const [state, set] = createStore<State>({
    status: "idle",
    pr: undefined,
    diffs: [],
    findings: [],
    groups: [],
    summary: undefined,
    progress: [],
    error: undefined,
  })

  return {
    state,
    setStatus(s: State["status"]) { set("status", s) },
    setPR(pr: PRMeta) { set("pr", pr) },
    setDiffs(diffs: Diff[]) { set("diffs", diffs) },
    addFinding(f: Finding) { set("findings", (prev) => [...prev, f]) },
    addGroup(g: Group) { set("groups", (prev) => [...prev, g]) },
    setSummary(s: Summary) { set("summary", s) },
    addProgress(msg: string) { set("progress", (prev) => [...prev, msg]) },
    setError(msg: string) { set("error", msg); set("status", "error") },
    toggleResolved(fid: string) {
      set("findings", (f) => f.id === fid, "resolved", (v) => !v)
    },
    reset() {
      set({
        status: "idle",
        pr: undefined,
        diffs: [],
        findings: [],
        groups: [],
        summary: undefined,
        progress: [],
        error: undefined,
      })
    },
  }
}

export type Store = ReturnType<typeof createReviewStore>
