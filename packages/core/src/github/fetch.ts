import { Octokit } from "@octokit/rest"
import type { PR } from "../types/pr"
import type { FileDiff } from "../types/review"

const BINARY = /\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|svg)$/i

async function content(
  kit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<string> {
  return kit.repos
    .getContent({ owner, repo, path, ref })
    .then(({ data }) =>
      "content" in data && data.content
        ? Buffer.from(data.content, "base64").toString("utf-8")
        : "",
    )
    .catch(() => "")
}

export async function fetch(opts: {
  owner: string
  repo: string
  number: number
  token?: string
}): Promise<{ pr: PR; diffs: FileDiff[] }> {
  const kit = new Octokit({ auth: opts.token ?? process.env.GITHUB_TOKEN })

  const { data: raw } = await kit.pulls.get({
    owner: opts.owner,
    repo: opts.repo,
    pull_number: opts.number,
  })

  const status = raw.merged ? "merged" : raw.state === "closed" ? "closed" : "open"

  const checks = await kit.checks
    .listForRef({ owner: opts.owner, repo: opts.repo, ref: raw.head.sha })
    .then(({ data: runs }) => ({
      passed: runs.check_runs.filter((r) => r.conclusion === "success").length,
      total: runs.total_count,
    }))
    .catch(() => undefined)

  const pr: PR = {
    owner: opts.owner,
    repo: opts.repo,
    number: opts.number,
    title: raw.title,
    body: raw.body ?? "",
    status,
    head: raw.head.ref,
    base: raw.base.ref,
    author: raw.user?.login ?? "unknown",
    labels: raw.labels.map((l) => (typeof l === "string" ? l : l.name ?? "")),
    checks,
    reviewers: (raw.requested_reviewers ?? [])
      .filter((r) => r != null && "login" in r)
      .map((r) => (r as { login: string }).login),
  }

  // Paginate files (GitHub clamps per_page to 100)
  const files: Awaited<ReturnType<typeof kit.pulls.listFiles>>["data"] = []
  let page = 1
  while (true) {
    const { data: batch } = await kit.pulls.listFiles({
      owner: opts.owner,
      repo: opts.repo,
      pull_number: opts.number,
      per_page: 100,
      page,
    })
    files.push(...batch)
    if (batch.length < 100) break
    page++
  }

  const diffs: FileDiff[] = await Promise.all(
    files
      .filter((f) => !BINARY.test(f.filename))
      .map(async (f) => {
        const stat =
          f.status === "added"
            ? "added" as const
            : f.status === "removed"
              ? "deleted" as const
              : f.status === "renamed"
                ? "renamed" as const
                : "modified" as const

        const before =
          stat === "added"
            ? ""
            : await content(kit, opts.owner, opts.repo, f.previous_filename ?? f.filename, raw.base.sha)

        const after =
          stat === "deleted"
            ? ""
            : await content(kit, opts.owner, opts.repo, f.filename, raw.head.sha)

        return {
          file: f.filename,
          before,
          after,
          additions: f.additions,
          deletions: f.deletions,
          status: stat,
        } satisfies FileDiff
      }),
  )

  return { pr, diffs }
}
