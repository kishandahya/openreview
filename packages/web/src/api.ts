async function checked<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error")
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export namespace API {
  export async function start(url: string, config?: Record<string, unknown>) {
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, config }),
    })
    return checked<{ id: string }>(res)
  }

  export async function get(id: string) {
    const res = await fetch(`/api/review/${id}`)
    return checked<Record<string, unknown>>(res)
  }

  export async function toggle(id: string, fid: string, resolved: boolean) {
    const res = await fetch(`/api/review/${id}/findings/${fid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved }),
    })
    return checked<{ ok: boolean }>(res)
  }

  export async function chat(id: string, content: string) {
    const res = await fetch(`/api/review/${id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
    return checked<{ ok: boolean }>(res)
  }

  export function streamUrl(id: string) {
    return `/api/review/${id}/stream`
  }

  export function chatStreamUrl(id: string) {
    return `/api/review/${id}/chat/stream`
  }
}
