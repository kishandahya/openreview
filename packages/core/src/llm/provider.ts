import type { LanguageModel } from "ai"
import type { Config } from "../types/config"

export async function model(cfg?: Config): Promise<LanguageModel> {
  const provider = cfg?.provider ?? "anthropic"

  if (provider === "anthropic") {
    const { createAnthropic } = await import("@ai-sdk/anthropic")
    return createAnthropic({
      apiKey: cfg?.key ?? process.env.ANTHROPIC_API_KEY,
    })(cfg?.model ?? "claude-sonnet-4-20250514")
  }

  const { createOpenAI } = await import("@ai-sdk/openai")
  return createOpenAI({
    apiKey: cfg?.key ?? process.env.OPENAI_API_KEY,
  })(cfg?.model ?? "gpt-4o")
}
