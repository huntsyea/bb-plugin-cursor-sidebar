import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { InlineThreadTitle } from "../src/InlineThreadTitle";

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@get-bb/plugin-sdk/app", () => ({ useSdk: () => ({ threads: { update } }) }));
vi.mock("../src/inbox", () => ({
  threadDisplayTitle: () => "Inactive thread",
  threadEditableTitle: () => "Inactive thread",
}));

// Only identity is consumed with the display helpers stubbed above.
const thread = { id: "inactive" } as Parameters<typeof InlineThreadTitle>[0]["thread"];
let container: HTMLDivElement;
let root: Root;
let coarse = false;
const navigate = vi.fn();
function Harness() {
  const [editing, setEditing] = useState(false);
  return <>
    <InlineThreadTitle thread={thread} editing={editing} onEditingChange={setEditing}
      onClick={(event) => {
        if (event.detail > 1) return;
        navigate({ metaKey: event.metaKey, ctrlKey: event.ctrlKey });
        // Model host route completion taking composer focus, as in BBP-26.
        setTimeout(() => container.querySelector("textarea")?.focus(), 400);
      }} />
    <textarea aria-label="Composer" />
  </>;
}
const title = () => container.querySelector("span")!;
const editor = () => container.querySelector("input");
function click(detail = 1, options: MouseEventInit = {}) {
  act(() => title().dispatchEvent(new MouseEvent("click", { bubbles: true, detail, ...options })));
}
function doubleClick() {
  click();
  act(() => vi.advanceTimersByTime(100));
  click(2);
  act(() => title().dispatchEvent(new MouseEvent("dblclick", { bubbles: true, detail: 2 })));
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", () => ({ matches: coarse }));
  coarse = false;
  navigate.mockClear();
  update.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<Harness />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("inactive title double-click retains focused editor after route completion window", () => {
  doubleClick();
  expect(editor()).not.toBeNull();
  act(() => vi.advanceTimersByTime(1000));
  expect(editor()).not.toBeNull();
  expect(document.activeElement).toBe(editor());
  expect(navigate).not.toHaveBeenCalled();
});
test("single title click opens once after the double-click window", () => {
  click();
  expect(navigate).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1000));
  expect(navigate).toHaveBeenCalledTimes(1);
});
test.each([{ metaKey: true }, { ctrlKey: true }])("modifier click stays immediate: %j", (keys) => {
  click(1, keys);
  expect(navigate).toHaveBeenCalledWith({ metaKey: false, ctrlKey: false, ...keys });
});
test("keyboard activation stays immediate", () => {
  click(0);
  expect(navigate).toHaveBeenCalledTimes(1);
});
test("touch activation stays immediate", () => {
  coarse = true;
  click();
  expect(navigate).toHaveBeenCalledTimes(1);
});
test("unmount cancels a pending navigation", () => {
  click();
  act(() => root.render(<div />));
  act(() => vi.advanceTimersByTime(1000));
  expect(navigate).not.toHaveBeenCalled();
});
test("Escape cancels rename without saving or navigating", () => {
  doubleClick();
  act(() => editor()!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  act(() => vi.advanceTimersByTime(1000));
  expect(editor()).toBeNull();
  expect(update).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
});

test("a second click near the end of the window cancels navigation", () => {
  click();
  act(() => vi.advanceTimersByTime(450));
  click(2);
  act(() => title().dispatchEvent(new MouseEvent("dblclick", { bubbles: true, detail: 2 })));
  act(() => vi.advanceTimersByTime(1000));
  expect(editor()).not.toBeNull();
  expect(navigate).not.toHaveBeenCalled();
});
