// @vitest-environment jsdom
import { renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test } from "vitest";
import { buildPooledOrdinarySection } from "../src/forest";
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
