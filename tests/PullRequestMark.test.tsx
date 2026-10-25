// @vitest-environment jsdom
import { renderSlot, type RenderSlotOptions } from "@get-bb/plugin-sdk/testing/app";
import { cleanup, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { PullRequestMark, githubPrStatus, pullRequestMarkView } from "../src/PullRequestMark";

type Row = NonNullable<Parameters<typeof pullRequestMarkView>[0]>;
type State = "open" | "draft" | "merged" | "closed";

function available(state: State, attention = "none", number = 42): Row {
  return {
    outcome: "available",
    pullRequest: {
      number,
      title: "Add things",
      url: `https://github.com/o/r/pull/${number}`,
      state,
      attention,
      checks: { state: attention === "checks_failed" ? "failing" : "passing" },
    },
  };
}

test.each([
  ["open", "GitPullRequest", "text-success", "Open pull request"],
  ["draft", "GitPullRequestDraft", "text-muted-foreground", "Draft pull request"],
  ["merged", "GitMerge", "text-pr-merged", "Merged pull request"],
  ["closed", "GitPullRequestClosed", "text-destructive", "Closed pull request"],
] as const)("%s PR keeps its mark, tone and tooltip", (state, icon, tone, label) => {
  expect(pullRequestMarkView(available(state))).toEqual({
    icon,
    tone,
    label,
    title: `#42 · ${label.toLowerCase()}`,
  });
});

test.each(["open", "draft"] as const)("failing checks recolour a live %s PR", (state) => {
  const view = pullRequestMarkView(available(state, "checks_failed", 7))!;
  expect(view.tone).toBe("text-destructive");
  expect(view.label).toMatch(/, checks failing$/);
  expect(view.title).toBe(`#7 · ${view.label.toLowerCase()}`);
});

test.each(["merged", "closed"] as const)("a %s PR's failed checks are history", (state) => {
  expect(pullRequestMarkView(available(state, "checks_failed"))!.label).not.toMatch(/checks failing/);
});

test("other attention values don't change the mark", () => {
  expect(pullRequestMarkView(available("open", "changes_requested"))).toEqual(
    pullRequestMarkView(available("open")),
  );
});

test("absent, unavailable and missing rows show nothing", () => {
  expect(pullRequestMarkView({ outcome: "absent" })).toBeNull();
  expect(pullRequestMarkView({ outcome: "unavailable", message: "gh failed" })).toBeNull();
  expect(pullRequestMarkView(undefined)).toBeNull();
});

afterEach(cleanup);

const slot = { component: PullRequestMark };
type Props = Parameters<typeof PullRequestMark>[0];
const render = (props: Props, options: RenderSlotOptions<typeof githubPrStatus>) =>
  renderSlot<Props, typeof githubPrStatus>(slot, props, { experimental_rpcContract: githubPrStatus, ...options });

test("reads PR Status keyed by the environment id", async () => {
  const view = render({ environmentId: "env_1" }, {
    rpc: { pullRequests: ({ keys }) => Object.fromEntries(keys.map((key) => [key, available("open")])) },
  });
  const mark = await waitFor(() => view.getByRole("img"));
  expect(mark.getAttribute("aria-label")).toBe("Open pull request");
  expect(mark.getAttribute("title")).toBe("#42 · open pull request");
  expect(view.rpcCalls).toEqual([{ method: "pullRequests", input: { keys: ["env_1"] } }]);
});

test("no environment: no read and no mark", async () => {
  const view = render({ environmentId: null }, {
    rpc: { pullRequests: () => ({}) },
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(view.queryByRole("img")).toBeNull();
  expect(view.rpcCalls).toEqual([]);
});

test("loading shows no mark", () => {
  const view = render({ environmentId: "env_1" }, {
    rpc: { pullRequests: () => new Promise(() => {}) },
  });
  expect(view.queryByRole("img")).toBeNull();
});

test("PR Status unavailable (read fails) shows no mark rather than an error", async () => {
  const view = render({ environmentId: "env_1" }, {
    rpc: {
      pullRequests: () => {
        throw new Error("plugin bb--github-pr-status is not running");
      },
    },
  });
  await waitFor(() => expect(view.rpcCalls.length).toBeGreaterThan(0));
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(view.queryByRole("img")).toBeNull();
  expect(view.container.textContent).toBe("");
});

test("an absent row shows no mark", async () => {
  const view = render({ environmentId: "env_1" }, {
    rpc: { pullRequests: () => ({ env_1: { outcome: "absent" } }) },
  });
  await waitFor(() => expect(view.rpcCalls.length).toBeGreaterThan(0));
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(view.queryByRole("img")).toBeNull();
});
