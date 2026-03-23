import { createSignal } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { API } from "../api"
import "./home.css"

export default function Home() {
  const nav = useNavigate()
  const [url, setUrl] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const [err, setErr] = createSignal("")

  const submit = async () => {
    if (!url().trim()) return
    setLoading(true)
    setErr("")
    const result = await API.start(url()).catch((e: Error) => {
      setErr(e.message)
      return null
    })
    setLoading(false)
    if (result) nav(`/review/${result.id}`)
  }

  return (
    <div data-component="home">
      <div data-slot="container">
        <h1 data-slot="title">OpenReview</h1>
        <p data-slot="subtitle">AI-powered code review for GitHub pull requests</p>
        <div data-slot="form">
          <input
            data-slot="input"
            type="text"
            placeholder="Paste a GitHub PR URL..."
            value={url()}
            onInput={(e) => setUrl(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button data-slot="submit" onClick={submit} disabled={loading()}>
            {loading() ? "Starting..." : "Start Review"}
          </button>
        </div>
        {err() && <p data-slot="error">{err()}</p>}
      </div>
    </div>
  )
}
