import { Show } from "solid-js"
import type { ReviewState, Finding } from "../types"
import "./detail.css"

interface DetailProps {
  store: ReviewState
  finding: Finding
  onClose: () => void
}

export function Detail(props: DetailProps) {
  return (
    <div data-component="detail">
      <div data-slot="detail-header">
        <div data-slot="detail-title-row">
          <span data-slot="detail-icon">🐛</span>
          <span data-slot="detail-label">Potential Bug</span>
          <span data-slot="detail-range">
            R{props.finding.start}-{props.finding.end}
          </span>
        </div>
        <button data-slot="close-btn" onClick={props.onClose}>
          ✕
        </button>
      </div>

      <div data-slot="detail-body">
        <div data-slot="detail-author">
          <span data-slot="detail-author-icon">⚙️</span>
          <span data-slot="detail-author-name">OpenReview</span>
        </div>

        <div data-slot="detail-bug-title">{props.finding.title}</div>

        <div data-slot="detail-description">
          {props.finding.description}
        </div>

        <div style={{ "margin-top": "8px" }}>
          <a data-slot="detail-file-link" href={`#diff-${props.finding.file}`}>
            {props.finding.file}:{props.finding.start}-{props.finding.end}
          </a>
        </div>

        <Show when={props.finding.fix}>
          <div data-slot="suggested-fix">
            <div data-slot="fix-label">Suggested fix</div>
            <pre data-slot="fix-code">{props.finding.fix!.code}</pre>
            <div data-slot="fix-explanation">
              {props.finding.fix!.explanation}
            </div>
          </div>
        </Show>
      </div>
    </div>
  )
}
