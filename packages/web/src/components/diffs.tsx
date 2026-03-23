import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import type { Store } from "../store"
import "./diffs.css"

interface Line {
  type: "context" | "add" | "remove"
  old: number | undefined
  new: number | undefined
  text: string
}

function diff(before: string, after: string): Line[] {
  const old = before.split("\n")
  const nw = after.split("\n")
  const lines: Line[] = []
  const oldSet = new Set(old)
  const newSet = new Set(nw)
  let oi = 0
  let ni = 0

  while (oi < old.length || ni < nw.length) {
    const ol = oi < old.length ? old[oi] : undefined
    const nl = ni < nw.length ? nw[ni] : undefined

    if (ol === nl) {
      lines.push({ type: "context", old: oi + 1, new: ni + 1, text: ol ?? "" })
      oi++; ni++
    } else if (ol !== undefined && (nl === undefined || !newSet.has(ol))) {
      lines.push({ type: "remove", old: oi + 1, new: undefined, text: ol })
      oi++
    } else if (nl !== undefined && (ol === undefined || !oldSet.has(nl))) {
      lines.push({ type: "add", old: undefined, new: ni + 1, text: nl })
      ni++
    } else {
      lines.push({ type: "remove", old: oi + 1, new: undefined, text: ol ?? "" })
      oi++
    }

    if (lines.length > 10000) break
  }

  return lines
}

function DiffView(props: { before: string; after: string }) {
  const lines = createMemo(() => diff(props.before, props.after))

  return (
    <div data-slot="diff-table">
      <For each={lines()}>
        {(line) => (
          <div data-slot="diff-line" data-type={line.type}>
            <span data-slot="line-num" data-side="old">{line.old ?? ""}</span>
            <span data-slot="line-num" data-side="new">{line.new ?? ""}</span>
            <span data-slot="line-marker">
              {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
            </span>
            <span data-slot="line-text">{line.text}</span>
          </div>
        )}
      </For>
    </div>
  )
}

export function Diffs(props: { store: Store; focused?: string }) {
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set())

  const toggle = (file: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(file)) next.delete(file)
      else next.add(file)
      return next
    })
  }

  createEffect(() => {
    const file = props.focused
    if (!file) return
    setExpanded((prev) => {
      if (prev.has(file)) return prev
      const next = new Set(prev)
      next.add(file)
      return next
    })
    document.querySelector(`[data-diff-file="${CSS.escape(file)}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  })

  return (
    <div data-component="diffs">
      <Show when={props.store.state.diffs.length > 0}>
        <div data-slot="toolbar">
          <span>{props.store.state.diffs.length} files changed</span>
          <button onClick={() => setExpanded(new Set(props.store.state.diffs.map((d) => d.file)))}>
            Expand all
          </button>
          <button onClick={() => setExpanded(new Set())}>Collapse all</button>
        </div>
      </Show>
      <For each={props.store.state.diffs}>
        {(d) => (
          <div data-slot="file-block" data-diff-file={d.file}>
            <button data-slot="file-header" onClick={() => toggle(d.file)}>
              <span data-slot="chevron" data-open={expanded().has(d.file)}>&#9654;</span>
              <span data-slot="status" data-type={d.status}>
                {d.status === "added" ? "A" : d.status === "deleted" ? "D" : d.status === "renamed" ? "R" : "M"}
              </span>
              <span data-slot="file-name">{d.file}</span>
              <span data-slot="changes">
                <span data-slot="additions">+{d.additions}</span>
                <span data-slot="deletions">-{d.deletions}</span>
              </span>
            </button>
            <Show when={expanded().has(d.file)}>
              <DiffView before={d.before} after={d.after} />
            </Show>
          </div>
        )}
      </For>
      <Show when={props.store.state.diffs.length === 0 && props.store.state.status === "running"}>
        <p data-slot="loading">Loading file diffs...</p>
      </Show>
    </div>
  )
}
