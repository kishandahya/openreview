import { Router, Route } from "@solidjs/router"
import { lazy } from "solid-js"

const Home = lazy(() => import("./pages/home"))
const Review = lazy(() => import("./pages/review"))

export function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/review/:id" component={Review} />
    </Router>
  )
}
