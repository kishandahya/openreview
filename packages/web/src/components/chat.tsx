import { createSignal, For, Show, onCleanup } from "solid-js"
import { createStore } from "solid-js/store"
import type { Store } from "../store"
import { API } from "../api"
import "./chat.css"

interface Msg {
  id: string
  role: "user" | "assistant"
  content: string
}

export function Chat(props: { id: string; store: Store }) {
  const [msgs, setMsgs] = createStore<Msg[]>([])
  const [input, setInput] = createSignal("")
  const [streaming, setStreaming] = createSignal(false)

  const send = async () => {
    const text = input().trim()
    if (!text || streaming()) return

    setInput("")
    const uid = Math.random().toString(36).slice(2)
    setMsgs(msgs.length, { id: uid, role: "user", content: text })

    await API.chat(props.id, text).catch(() => {})

    const aid = Math.random().toString(36).slice(2)
    setMsgs(msgs.length, { id: aid, role: "assistant", content: "" })
    setStreaming(true)

    const sse = new EventSource(API.chatStreamUrl(props.id))
    const idx = msgs.length - 1

    sse.addEventListener("text", (e) => {
      setMsgs(idx, "content", (c) => c + e.data)
    })

    sse.addEventListener("done", () => {
      sse.close()
      setStreaming(false)
    })

    sse.addEventListener("error", () => {
      sse.close()
      setStreaming(false)
    })

    onCleanup(() => sse.close())
  }

  return (
    <div data-component="chat">
      <div data-slot="messages">
        <Show when={msgs.length === 0}>
          <div data-slot="greeting">
            <p>Hey! I'm OpenReview. I've reviewed this PR and I'm ready to help.</p>
            <p>Ask me about the changes, or request edits directly.</p>
          </div>
          <div data-slot="prompts">
            <p data-slot="prompts-label">Suggested prompts</p>
            <button data-slot="prompt" onClick={() => { setInput("Fix bugs"); send() }}>Fix bugs</button>
            <button data-slot="prompt" onClick={() => { setInput("Summarize changes"); send() }}>Summarize changes</button>
            <button data-slot="prompt" onClick={() => { setInput("Explain architecture"); send() }}>Explain architecture</button>
          </div>
        </Show>
        <For each={msgs}>
          {(msg) => (
            <div data-slot="message" data-role={msg.role}>
              <span data-slot="role">{msg.role === "user" ? "You" : "OpenReview"}</span>
              <p data-slot="text">{msg.content}</p>
            </div>
          )}
        </For>
      </div>
      <div data-slot="input-row">
        <input
          data-slot="input"
          type="text"
          placeholder="Ask anything about this PR..."
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={streaming()}
        />
        <button data-slot="send" onClick={send} disabled={streaming()}>Send</button>
      </div>
    </div>
  )
}
