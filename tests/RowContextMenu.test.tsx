// @vitest-environment jsdom
import { renderSlot, type TestThreadActionsResolver } from "@get-bb/plugin-sdk/testing/app";
import type { PluginSidebarThread, PluginThreadActionEntry } from "@get-bb/plugin-sdk/app";
import { cleanup, fireEvent } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { RowContextMenu } from "../src/RowContextMenu";

afterEach(cleanup);

// The fields the menu and its action target read.
const thread = {
  id: "thr_1",
  projectId: "proj_1",
  parentThreadId: null,
  archivedAt: null,
  pinnedAt: null,
  sectionId: null,
  isUnread: true,
  status: "idle",
  environment: null,
  title: "Fixture",
  titleFallback: null,
  displayTitle: "Fixture",
} as unknown as PluginSidebarThread;

function entry(key: string, label: string, options: { disabled?: boolean; run?: () => Promise<void> } = {}): PluginThreadActionEntry {
  return {
    key,
    pluginId: "bb--core",
    group: "core",
    action: { label, icon: "Archive", ...(options.disabled ? { disabled: true } : {}), run: options.run ?? (async () => {}) },
  };
}

function openMenu(threadActions: TestThreadActionsResolver) {
  const view = renderSlot(
    { component: RowContextMenu },
    { thread, onRename: () => {}, children: <span>Fixture row</span> },
    { threadActions },
  );
  fireEvent.click(view.getByRole("button", { name: "Actions for Fixture" }));
  return view;
}

test("a host action that is missing has no menu entry", () => {
  const view = openMenu(() => [
    entry("bb--core/rename", "Rename"),
    entry("bb--core/read", "Mark read"),
    entry("bb--core/archive", "Archive"),
  ]);
  expect(view.getByRole("button", { name: "Archive" })).toBeTruthy();
  expect(view.getByRole("button", { name: "Mark read" })).toBeTruthy();
  expect(view.queryByRole("button", { name: "Delete" })).toBeNull();
});

test("a host action that is disabled shows disabled and does not run", () => {
  const run = vi.fn(async () => {});
  const view = openMenu(() => [
    entry("bb--core/rename", "Rename"),
    entry("bb--core/read", "Mark read"),
    entry("bb--core/archive", "Archive", { disabled: true, run }),
    entry("bb--core/delete", "Delete"),
  ]);
  const archive = view.getByRole("button", { name: "Archive" }) as HTMLButtonElement;
  expect(archive.disabled).toBe(true);
  fireEvent.click(archive);
  expect(run).not.toHaveBeenCalled();
  expect((view.getByRole("button", { name: "Delete" }) as HTMLButtonElement).disabled).toBe(false);
});
