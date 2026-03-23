import z from "zod"

export const Message = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: z.number(),
  })


export type Message = z.infer<typeof Message>
