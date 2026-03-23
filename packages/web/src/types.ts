export interface PR {
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

export interface FileDiff {
  file: string
  before: string
  after: string
  additions: number
  deletions: number
  status: "added" | "modified" | "deleted" | "renamed"
}

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

export interface GroupFile {
  path: string
  additions: number
  deletions: number
}

export interface Group {
  title: string
  description: string
  files: GroupFile[]
  order: number
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

export interface CopyMoveEntry {
  from: string
  to: string
  kind: "copy" | "move"
  similarity: number
}

export interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export type Phase =
  | "context"
  | "copy-move"
  | "semantic"
  | "bugs"
  | "fix"
  | "drift"
  | "summary"

export interface ProgressEvent {
  type: "progress"
  phase: Phase
  message: string
}

export interface FindingEvent {
  type: "finding"
  finding: Finding
}

export interface GroupEvent {
  type: "group"
  group: Group
}

export interface SummaryEvent {
  type: "summary"
  verdict: "pass" | "fail"
  confidence: number
  text: string
  counts: Summary["counts"]
}

export interface ErrorEvent {
  type: "error"
  message: string
}

export interface DoneEvent {
  type: "done"
}

export type PipelineEvent =
  | ProgressEvent
  | FindingEvent
  | GroupEvent
  | SummaryEvent
  | ErrorEvent
  | DoneEvent

export interface Review {
  id: string
  status: "pending" | "running" | "done" | "error"
  url: string
  pr?: PR
  diffs: FileDiff[]
  copyMoves: CopyMoveEntry[]
  findings: Finding[]
  groups: Group[]
  summary?: Summary
  messages: Message[]
  created: number
  updated: number
}

export interface ReviewState {
  status: Review["status"]
  pr: PR | undefined
  diffs: FileDiff[]
  findings: Finding[]
  groups: Group[]
  summary: Summary | undefined
  progress: ProgressEvent[]
  messages: Message[]
  error: string | undefined
  selected: string | undefined
  detail: Finding | undefined
  tab: "info" | "chat"
  navTab: "sections" | "files"
}
