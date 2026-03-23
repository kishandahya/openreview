import { createSignal, For, Show } from "solid-js"
import type { Store } from "../store"
import "./analysis.css"

export function Analysis(props: { store: Store }) {
  const [open, setOpen] = createSignal(true)

  return (
    <div data-component="analysis">
      <button data-slot="toggle" onClick={() => setOpen((v) => !v)}>
        <span data-slot="chevron" data-open={open()}>&#9660;</span>
        <span>OpenReview's AI analysis</span>
        <Show when={props.store.state.status === "running"}>
          <span data-slot="badge">Analyzing...</span>
        </Show>
      </button>
      <Show when={open()}>
        <div data-slot="content">
          <Show when={props.store.state.summary}>
            <p data-slot="summary">{props.store.state.summary!.text}</p>
          </Show>
          <Show when={props.store.state.progress.length > 0}>
            <div data-slot="log">
              <For each={props.store.state.progress}>
                {(msg) => <p data-slot="log-entry">{msg}</p>}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  )
}
