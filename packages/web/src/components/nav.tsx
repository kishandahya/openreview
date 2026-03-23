import { createSignal, For, Show } from "solid-js"
import type { Store } from "../store"
import "./nav.css"

export function Nav(props: { store: Store; onSelect: (file: string) => void }) {
  const [tab, setTab] = createSignal<"sections" | "files">("sections")

  return (
    <div data-component="nav">
      <div data-slot="tabs">
        <button data-slot="tab" data-active={tab() === "sections"} onClick={() => setTab("sections")}>
          Sections
        </button>
        <button data-slot="tab" data-active={tab() === "files"} onClick={() => setTab("files")}>
          Files
        </button>
      </div>
      <Show when={tab() === "sections"}>
        <div data-slot="sections">
          <Show when={props.store.state.groups.length === 0}>
            <p data-slot="empty">No groups yet</p>
          </Show>
          <For each={props.store.state.groups}>
            {(group, idx) => (
              <div data-slot="group">
                <div data-slot="group-header">
                  <span data-slot="group-num">{idx() + 1}</span>
                  <span data-slot="group-title">{group.title}</span>
                </div>
                <div data-slot="group-meta">
                  <span>{group.files.length} files</span>
                  <span data-slot="additions">
                    +{group.files.reduce((s, f) => s + f.additions, 0)}
                  </span>
                  <span data-slot="deletions">
                    -{group.files.reduce((s, f) => s + f.deletions, 0)}
                  </span>
                </div>
                <div data-slot="group-files">
                  <For each={group.files}>
                    {(file) => (
                      <button data-slot="file" onClick={() => props.onSelect(file.path)}>
                        {file.path.split("/").pop()}
                        <span data-slot="file-path">{file.path}</span>
                      </button>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
      <Show when={tab() === "files"}>
        <div data-slot="tree">
          <For each={props.store.state.diffs}>
            {(diff) => (
              <button data-slot="tree-file" onClick={() => props.onSelect(diff.file)}>
                <span data-slot="tree-name">{diff.file}</span>
                <span data-slot="tree-stats">
                  <span data-slot="additions">+{diff.additions}</span>
                  <span data-slot="deletions">-{diff.deletions}</span>
                </span>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
