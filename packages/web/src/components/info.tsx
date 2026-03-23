import { createSignal, For, Show, type JSX } from "solid-js"
import type { Store, Finding } from "../store"
import "./info.css"

function Section(props: { title: string; count: number; color: string; open?: boolean; children: JSX.Element }) {
  const [expanded, setExpanded] = createSignal(props.open ?? false)

  return (
    <div data-slot="section">
      <button data-slot="section-header" onClick={() => setExpanded((v) => !v)}>
        <span data-slot="section-chevron" data-open={expanded()}>&#9654;</span>
        <span data-slot="section-count" style={{ color: props.color }}>{props.count}</span>
        <span data-slot="section-title">{props.title}</span>
      </button>
      <Show when={expanded()}>
        <div data-slot="section-body">{props.children}</div>
      </Show>
    </div>
  )
}

export function Info(props: { store: Store; onFocus: (file: string) => void }) {
  const [detail, setDetail] = createSignal<Finding | null>(null)

  const bugs = () => props.store.state.findings.filter((f) => f.category === "bug")
  const flags = () => props.store.state.findings.filter((f) => f.category === "flag")
  const checks = () => props.store.state.pr?.checks
  const verdict = () => props.store.state.summary?.verdict

  return (
    <div data-component="info">
      <Show when={detail()}>
        <div data-slot="detail">
          <button data-slot="detail-close" onClick={() => setDetail(null)}>&times;</button>
          <h3 data-slot="detail-title">
            Potential Bug
            <span data-slot="detail-range">R{detail()!.start}-{detail()!.end}</span>
          </h3>
          <p data-slot="detail-file">{detail()!.file}</p>
          <p data-slot="detail-desc">{detail()!.description}</p>
          <Show when={detail()!.fix}>
            <div data-slot="detail-fix">
              <p data-slot="fix-label">Suggested fix</p>
              <pre data-slot="fix-code">{detail()!.fix!.code}</pre>
              <p data-slot="fix-explain">{detail()!.fix!.explanation}</p>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={!detail()}>
        <Show when={bugs().length > 0}>
          <Section title="Potential bugs" count={bugs().length} color="var(--orange)" open>
            <For each={bugs()}>
              {(f) => (
                <button data-slot="finding" onClick={() => { setDetail(f); props.onFocus(f.file) }}>
                  <span data-slot="finding-icon">&#9888;</span>
                  <div data-slot="finding-info">
                    <span data-slot="finding-title">{f.title}</span>
                    <span data-slot="finding-meta">
                      <span data-slot="finding-tag">Bug</span>
                      {f.file}:{f.start}
                    </span>
                  </div>
                </button>
              )}
            </For>
          </Section>
        </Show>

        <Show when={flags().length > 0}>
          <Section title="Flags" count={flags().length} color="var(--blue)">
            <For each={flags()}>
              {(f) => (
                <button data-slot="finding" onClick={() => { setDetail(f); props.onFocus(f.file) }}>
                  <span data-slot="finding-icon">&#9873;</span>
                  <div data-slot="finding-info">
                    <span data-slot="finding-title">{f.title}</span>
                    <span data-slot="finding-meta">
                      <span data-slot="finding-tag" data-type="flag">Flag</span>
                      {f.file}:{f.start}
                    </span>
                  </div>
                </button>
              )}
            </For>
          </Section>
        </Show>

        <Show when={checks()}>
          <div data-slot="checks">
            <span data-slot="checks-label">Checks</span>
            <span data-slot="checks-count">{checks()!.passed}/{checks()!.total}</span>
            <div data-slot="checks-bar">
              <div
                data-slot="checks-passed"
                style={{ width: `${checks()!.total > 0 ? (checks()!.passed / checks()!.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </Show>

        <Show when={props.store.state.pr}>
          <div data-slot="meta-section">
            <div data-slot="meta-row">
              <span data-slot="meta-label">Reviewers</span>
              <span data-slot="meta-value">
                {props.store.state.pr!.reviewers.length > 0
                  ? props.store.state.pr!.reviewers.join(", ")
                  : "No reviewers"}
              </span>
            </div>
            <div data-slot="meta-row">
              <span data-slot="meta-label">Labels</span>
              <span data-slot="meta-value">
                {props.store.state.pr!.labels.length > 0
                  ? props.store.state.pr!.labels.join(", ")
                  : "No labels"}
              </span>
            </div>
          </div>
        </Show>

        <Show when={verdict()}>
          <div data-slot="verdict" data-type={verdict()}>
            {verdict() === "pass" ? "PASS" : "FAIL"}
          </div>
        </Show>
      </Show>
    </div>
  )
}
