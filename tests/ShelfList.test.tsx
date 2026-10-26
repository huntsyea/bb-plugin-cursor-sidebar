// @vitest-environment jsdom
import { renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test } from "vitest";
import type { PluginSidebarThread, PluginThreadActionEntry } from "@get-bb/plugin-sdk/app";
import { buildPooledOrdinarySection, buildSections } from "../src/forest";
import { DEFAULT_SIDEBAR_VIEW, type ViewGroupBy } from "../src/sidebar-view";
import { ShelfList, type TreeContext } from "../src/ThreadTree";

afterEach(cleanup);

const noop = () => {};
// An empty sidebar: no threads, folders or drag, so rows never read the rest.
function emptyContext(groupBy: ViewGroupBy): TreeContext {
  return {
    visibleById: new Map(),
    descendantsById: new Map(),
    rawById: new Map(),
    workspacePaths: new Map(),
    primaryHostId: null,
    activeThreadId: null,
    expandedParents: new Set(),
    expandedAgeGroups: new Set(),
    onToggleAgeGroup: noop,
    now: Date.parse("2026-10-26T12:00:00Z"),
    onNavigate: noop,
    onToggleChildren: noop,
    onThreadDragStart: noop,
    onThreadDragPickUp: noop,
    canDragThreads: true,
    onProjectDragPickUp: noop,
    consumeSuppressedClick: () => false,
    shortcutKeys: null,
    dropTarget: null,
    draggingThreadId: null,
    threadSections: [],
    collapsedGroups: new Set(),
    onToggleGroup: noop,
    onRemoveFromFolder: noop,
    onRenameFolder: noop,
    onDeleteFolder: noop,
    onTogglePin: noop,
    canPin: () => true,
    view: { ...DEFAULT_SIDEBAR_VIEW, groupBy },
    statusOf: () => undefined,
    folderDropTarget: null,
    childDropTarget: null,
  };
}

const chats = buildPooledOrdinarySection([], "standalone", "Chats");

function Shelf({ groupBy, tools }: { groupBy: ViewGroupBy; tools?: ReactNode }) {
  return <ShelfList section={chats} shelf="active" ctx={emptyContext(groupBy)} grouped firstGroupTools={tools} />;
}

const tools = <>
  <button type="button">View options</button>
  <button type="button">New chat</button>
</>;

test("an empty Today group still carries the view menu and the New chat picker", () => {
  const view = renderSlot({ component: Shelf }, { groupBy: "updated", tools });
  expect(view.getByRole("button", { name: "Today" })).toBeTruthy();
  expect(view.getByRole("button", { name: "View options" })).toBeTruthy();
  expect(view.getByRole("button", { name: "New chat" })).toBeTruthy();
  // Today offers one way to start a chat: the project picker in its tools.
  expect(view.queryByRole("button", { name: /^New thread in/ })).toBeNull();
});

test("Projects grouping draws no Today heading for standalone chats", () => {
  const view = renderSlot({ component: Shelf }, { groupBy: "workspace" });
  expect(view.queryByText("Today")).toBeNull();
  expect(view.queryByRole("button", { name: /^New thread in/ })).toBeNull();
});

function threadFixture(): PluginSidebarThread {
  return {
    id: "thr_1", projectId: "proj_chats", title: "Fixture", titleFallback: null, displayTitle: "Fixture",
    parentThreadId: null, lifecycleOwnerThreadId: null, sourceThreadId: null, sectionId: null,
    originKind: null, originPluginId: null, providerId: "claude-code", status: "idle",
    runtimeStatus: "idle", queuedWork: { count: 0 }, hasPendingInteraction: false,
    activity: { workflows: 0, backgroundAgents: 0, backgroundCommands: 0, planMode: 0, goals: 0 },
    indicator: "none", indicatorLabel: null, isUnread: false, isPinned: false, pinnedAt: null,
    pinSortKey: null, isArchived: false, archivedAt: null, href: "/threads/thr_1", isHidden: false,
    environment: null, host: null, createdAt: 0, updatedAt: Date.parse("2026-10-26T11:00:00Z"),
  } as unknown as PluginSidebarThread;
}

function archiveEntry(options: { disabled?: boolean } = {}): PluginThreadActionEntry {
  return {
    key: "bb--core/archive", pluginId: "bb--core", group: "core",
    action: { label: "Archive", icon: "Archive", ...(options.disabled ? { disabled: true } : {}), run: async () => {} },
  };
}

function RowShelf() {
  const fixture = threadFixture();
  const homes = buildSections([fixture], [{ id: "proj_chats", name: "Chats", isPersonal: true }], () => "active");
  const section = buildPooledOrdinarySection(homes, "standalone", "Chats");
  const ctx = { ...emptyContext("workspace"), visibleById: new Map([[fixture.id, fixture]]), rawById: new Map([[fixture.id, fixture]]) };
  return <ShelfList section={section} shelf="active" ctx={ctx} grouped />;
}

const hoverArchive = (view: ReturnType<typeof renderSlot>) =>
  view.container.querySelector<HTMLButtonElement>("[data-thread-actions] button[aria-label='Archive']");

test.each([
  ["shows when the host offers it", () => [archiveEntry()], true],
  ["is absent when the host offers none", () => [], false],
  ["is absent when the host disables it", () => [archiveEntry({ disabled: true })], false],
] as const)("the row's hover Archive %s", (_, threadActions, shown) => {
  const view = renderSlot({ component: RowShelf }, {}, { threadActions });
  expect(view.getByText("Fixture")).toBeTruthy();
  expect(hoverArchive(view) !== null).toBe(shown);
});
