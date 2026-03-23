import { Hono } from "hono"
import { cors } from "hono/cors"
import { review } from "./routes/review"
import { chat } from "./routes/chat"
import { findings } from "./routes/findings"
import { exp } from "./routes/export"

export function create(): Hono {
  const app = new Hono()

  app.use("/*", cors({ origin: "*" }))

  app.route("/api/review", review())
  app.route("/api/review", chat())
  app.route("/api/review", findings())
  app.route("/api/review", exp())

  return app
}
