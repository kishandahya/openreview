import { create } from "./index"

const port = parseInt(process.env.PORT ?? "3847", 10)
const app = create()

export default {
  port,
  fetch: app.fetch,
}

console.log(`OpenReview server running on http://localhost:${port}`)
