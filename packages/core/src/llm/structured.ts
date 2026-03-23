import { generateObject } from "ai"
import type { ZodType } from "zod"

const RETRIES = 3
const BASE = 1000
const RETRIABLE = new Set([429, 500, 503])

export async function structured<T>(opts: {
  model: Parameters<typeof generateObject>[0]["model"]
  schema: ZodType<T>
  system: string
  prompt: string
}): Promise<{ result: T; usage: { input: number; output: number } }> {
  let tries = 0
  while (true) {
    const res = await generateObject({
      model: opts.model,
      schema: opts.schema,
      system: opts.system,
      prompt: opts.prompt,
    }).catch((err: unknown) => {
      tries++
      const status = (err as { status?: number }).status
      if (tries >= RETRIES || !RETRIABLE.has(status ?? 0)) throw err
      return null
    })

    if (res) {
      return {
        result: res.object,
        usage: {
          input: res.usage?.inputTokens ?? 0,
          output: res.usage?.outputTokens ?? 0,
        },
      }
    }

    await new Promise((r) => setTimeout(r, BASE * Math.pow(2, tries)))
  }
}
