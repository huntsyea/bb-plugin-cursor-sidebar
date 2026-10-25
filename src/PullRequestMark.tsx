import { defineRpcContract } from "@get-bb/plugin-sdk";
import { experimental_useRpcKeyedQuery as useRpcKeyedQuery } from "@get-bb/plugin-sdk/app";
import { z } from "zod";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * The part of the bundled GitHub PR Status plugin's contract this mark reads
 * (`bb plugin rpc inspect bb--github-pr-status pullRequests` prints all of it).
 * One row per environment id: `available` with a pull request, `absent`, or
 * `unavailable` when the machine is offline or `gh` failed.
 */
export const githubPrStatus = defineRpcContract({
  pullRequests: {
    input: z.object({ keys: z.array(z.string()) }),
    output: z.record(
      z.string(),
      z.discriminatedUnion("outcome", [
        z.object({
          outcome: z.literal("available"),
          pullRequest: z.object({
            number: z.number(),
            title: z.string(),
            url: z.string(),
            state: z.enum(["draft", "open", "merged", "closed"]),
            attention: z.string(),
            checks: z.object({ state: z.string() }),
          }),
        }),
        z.object({ outcome: z.literal("absent") }),
        z.object({ outcome: z.literal("unavailable"), message: z.string() }),
      ]),
    ),
  },
});

type PullRequestRow = z.infer<typeof githubPrStatus.pullRequests.output>[string];
type PullRequest = Extract<PullRequestRow, { outcome: "available" }>["pullRequest"];

interface Presentation {
  icon: IconName;
  tone: string;
  label: string;
}

/**
 * The leading mark for a real pull request, in Dray's open/draft/merged/closed
 * vocabulary. A failing check recolours the mark rather than adding a second
 * one: a broken build is a fact about this PR, and a merged or closed PR's
 * checks are history. No PR means no mark — nothing is fabricated.
 */
const PRESENTATION: Record<PullRequest["state"], Presentation> = {
  open: { icon: "GitPullRequest", tone: "text-success", label: "Open pull request" },
  draft: {
    icon: "GitPullRequestDraft",
    tone: "text-muted-foreground",
    label: "Draft pull request",
  },
  merged: { icon: "GitMerge", tone: "text-pr-merged", label: "Merged pull request" },
  closed: {
    icon: "GitPullRequestClosed",
    tone: "text-destructive",
    label: "Closed pull request",
  },
};

export interface PullRequestMarkView {
  icon: IconName;
  tone: string;
  label: string;
  title: string;
}

/**
 * Maps one environment's PR Status row to the mark, or null for anything that
 * isn't a pull request we can show: no row yet (loading, a failed read, or PR
 * Status not running), `absent`, and `unavailable`.
 */
export function pullRequestMarkView(row: PullRequestRow | undefined): PullRequestMarkView | null {
  if (row?.outcome !== "available") return null;
  const { pullRequest } = row;
  const presentation = PRESENTATION[pullRequest.state];
  const failing =
    pullRequest.attention === "checks_failed" &&
    pullRequest.state !== "merged" &&
    pullRequest.state !== "closed";
  const label = failing ? `${presentation.label}, checks failing` : presentation.label;
  return {
    icon: presentation.icon,
    tone: failing ? "text-destructive" : presentation.tone,
    label,
    title: `#${pullRequest.number} · ${label.toLowerCase()}`,
  };
}

/**
 * Reads PR Status's cached pull request for the row's environment. The lookup
 * is keyed and shared (rows in one environment share one key, and PR Status
 * re-checks only rows on screen), so the sidebar never shells out to Git for
 * the whole list. A thread without an environment has no PR to show.
 */
export function PullRequestMark({ environmentId }: { environmentId: string | null }) {
  const { data } = useRpcKeyedQuery({
    pluginId: "bb--github-pr-status",
    contract: githubPrStatus,
    method: "pullRequests",
    keys: environmentId ? [environmentId] : [],
  });
  const view = pullRequestMarkView(environmentId ? data?.[environmentId] : undefined);
  if (view === null) return null;

  return (
    <span
      role="img"
      aria-label={view.label}
      title={view.title}
      className="mr-1 flex size-3.5 shrink-0 items-center justify-center"
    >
      <Icon name={view.icon} className={cn("size-3.5", view.tone)} />
    </span>
  );
}
