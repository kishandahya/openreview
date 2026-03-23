import { Show } from "solid-js"
import type { Store } from "../store"
import "./header.css"

export function Header(props: { store: Store }) {
  const pr = () => props.store.state.pr
  const total = () => props.store.state.diffs.reduce((s, d) => s + d.additions + d.deletions, 0)
  const adds = () => props.store.state.diffs.reduce((s, d) => s + d.additions, 0)
  const dels = () => props.store.state.diffs.reduce((s, d) => s + d.deletions, 0)

  return (
    <div data-component="header">
      <Show when={pr()} fallback={<p data-slot="loading">Loading PR data...</p>}>
        <div data-slot="status" data-type={pr()!.status}>{pr()!.status}</div>
        <p data-slot="repo">{pr()!.owner}/{pr()!.repo} #{pr()!.number}</p>
        <h1 data-slot="title">{pr()!.title}</h1>
        <div data-slot="meta">
          <span data-slot="author">{pr()!.author}</span>
          <span data-slot="branch">{pr()!.head}</span>
          <span data-slot="arrow">&rarr;</span>
          <span data-slot="branch">{pr()!.base}</span>
          <span data-slot="files">{props.store.state.diffs.length} files</span>
          <span data-slot="additions">+{adds()}</span>
          <span data-slot="deletions">-{dels()}</span>
        </div>
      </Show>
    </div>
  )
}
