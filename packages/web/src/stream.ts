import { onCleanup } from "solid-js"
import type { Store, PRMeta, Diff, Finding, Group, Summary } from "./store"
import { API } from "./api"

interface Snapshot {
  pr?: PRMeta
  diffs?: Diff[]
  findings?: Finding[]
  groups?: Group[]
  summary?: Summary
  status?: string
}

export function createStream(id: string, store: Store) {
  let source: EventSource | undefined
  let retries = 0
  const MAX = 5
  const BASE = 1000

  // Hydrate from REST API
  API.get(id).then((data) => {
    const snap = data as Snapshot
    if (snap.pr) store.setPR(snap.pr)
    if (snap.diffs?.length) store.setDiffs(snap.diffs)
    if (snap.findings?.length) snap.findings.forEach((f) => store.addFinding(f))
    if (snap.groups?.length) snap.groups.forEach((g) => store.addGroup(g))
    if (snap.summary) store.setSummary(snap.summary)
    if (snap.status === "done") store.setStatus("done")
    if (snap.status === "error") store.setError("Review failed")
  }).catch(() => {})

  function connect() {
    source = new EventSource(API.streamUrl(id))

    source.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data)
      store.addProgress(data.message)
      store.setStatus("running")
    })

    source.addEventListener("finding", (e) => {
      const data = JSON.parse(e.data)
      store.addFinding(data.finding)
    })

    source.addEventListener("group", (e) => {
      const data = JSON.parse(e.data)
      store.addGroup(data.group)
    })

    source.addEventListener("summary", (e) => {
      const data = JSON.parse(e.data)
      store.setSummary({
        verdict: data.verdict,
        confidence: data.confidence,
        text: data.text,
        counts: data.counts,
      })
    })

    source.addEventListener("error", (e) => {
      if (e instanceof MessageEvent) {
        const data = JSON.parse(e.data)
        store.setError(data.message)
      }
    })

    source.addEventListener("done", () => {
      store.setStatus("done")
      source?.close()
    })

    source.onerror = () => {
      source?.close()
      if (retries < MAX) {
        retries++
        setTimeout(connect, BASE * Math.pow(2, retries))
      }
    }
  }

  connect()

  onCleanup(() => {
    source?.close()
  })
}
