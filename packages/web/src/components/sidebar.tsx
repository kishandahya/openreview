import { createSignal, Show } from "solid-js"
import type { Store } from "../store"
import { Info } from "./info"
import { Chat } from "./chat"
import "./sidebar.css"

export function Sidebar(props: { store: Store; id: string; onFocus: (file: string) => void }) {
  const [tab, setTab] = createSignal<"info" | "chat">("info")

  return (
    <div data-component="sidebar">
      <div data-slot="tabs">
        <button data-slot="tab" data-active={tab() === "info"} onClick={() => setTab("info")}>
          Info
        </button>
        <button data-slot="tab" data-active={tab() === "chat"} onClick={() => setTab("chat")}>
          Chat
        </button>
      </div>
      <div data-slot="content">
        <Show when={tab() === "info"}>
          <Info store={props.store} onFocus={props.onFocus} />
        </Show>
        <Show when={tab() === "chat"}>
          <Chat id={props.id} store={props.store} />
        </Show>
      </div>
    </div>
  )
}
