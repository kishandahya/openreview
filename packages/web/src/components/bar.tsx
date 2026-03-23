import { createSignal } from "solid-js"
import type { Store } from "../store"
import { API } from "../api"
import "./bar.css"

export function Bar(props: { id: string; store: Store }) {
  const [input, setInput] = createSignal("")

  const send = async () => {
    const text = input().trim()
    if (!text) return
    setInput("")
    await API.chat(props.id, text).catch(() => {})
  }

  return (
    <div data-component="bar">
      <input
        data-slot="input"
        type="text"
        placeholder="Ask anything about this PR..."
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
      />
      <button data-slot="send" onClick={send}>&#8593;</button>
    </div>
  )
}
