import { createSignal } from "solid-js"
import { useParams } from "@solidjs/router"
import { createReviewStore } from "../store"
import { createStream } from "../stream"
import { Nav } from "../components/nav"
import { Header } from "../components/header"
import { Analysis } from "../components/analysis"
import { Diffs } from "../components/diffs"
import { Sidebar } from "../components/sidebar"
import { Bar } from "../components/bar"
import "./review.css"

export default function Review() {
  const params = useParams()
  const store = createReviewStore()
  const [focused, setFocused] = createSignal<string | undefined>()

  const id = () => params.id ?? ""
  createStream(id(), store)

  return (
    <div data-component="review">
      <div data-slot="left">
        <Nav store={store} onSelect={setFocused} />
      </div>
      <div data-slot="center">
        <Header store={store} />
        <Analysis store={store} />
        <Diffs store={store} focused={focused()} />
      </div>
      <div data-slot="right">
        <Sidebar store={store} id={id()} onFocus={setFocused} />
      </div>
      <div data-slot="bottom">
        <Bar id={id()} store={store} />
      </div>
    </div>
  )
}
