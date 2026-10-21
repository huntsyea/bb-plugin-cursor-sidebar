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
let initiallySelected = false;
let routeDelay = 400;
let suppressed = false;
const navigate = vi.fn();
function Harness() {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(initiallySelected);
  return <>
    <InlineThreadTitle thread={thread} selected={selected} editing={editing} onEditingChange={setEditing}
      onClick={(event) => {
        event.preventDefault();
        if (event.detail > 1 || suppressed) return false;
        navigate({ metaKey: event.metaKey, ctrlKey: event.ctrlKey });
        // Model host route completion taking composer focus, as in BBP-26.
        if (!selected) setTimeout(() => {
          setSelected(true);
          container.querySelector<HTMLElement>("[contenteditable]")?.focus();
        }, routeDelay);
        return true;
      }} />
    <div id="thread-detail-follow-up-composer" contentEditable tabIndex={0} />
    <button>Other control</button>
    <button aria-label="Menu Rename" onClick={() => setEditing(true)}>Rename</button>
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
  initiallySelected = false;
  routeDelay = 400;
  suppressed = false;
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

function changeDraft(value = "Renamed") {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(editor(), value);
    editor()!.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const settle = () => act(() => vi.advanceTimersByTime(1000));
test("inactive double-click navigates immediately and retains focused editor after route autofocus", async () => {
  doubleClick();
  expect(navigate).toHaveBeenCalledTimes(1);
  await act(async () => vi.advanceTimersByTime(1000));
  expect(editor()).not.toBeNull();
  expect(document.activeElement).toBe(editor());
});
test("single click calls navigation synchronously without scheduling a navigation timer", () => {
  const now = performance.now();
  click();
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(performance.now()).toBe(now);
  // Only the harness's route-completion timer exists.
  expect(vi.getTimerCount()).toBe(1);
});
test.each([{ metaKey: true }, { ctrlKey: true }])("modifier click stays immediate: %j", keys => {
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
test("real blur to another control commits during the guard window", () => {
  doubleClick();
  changeDraft();
  act(() => container.querySelector("button")!.focus());
  expect(editor()).toBeNull();
  expect(update).toHaveBeenCalledExactlyOnceWith({ threadId: "inactive", title: "Renamed" });
});
test("user pointer intent in composer ends the exception and commits", () => {
  doubleClick();
  changeDraft();
  act(() => {
    const composer = container.querySelector<HTMLElement>("[contenteditable]")!;
    composer.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    composer.focus();
  });
  expect(editor()).toBeNull();
  expect(update).toHaveBeenCalledTimes(1);
});
test("Tab ends the exception and commits", () => {
  doubleClick();
  changeDraft();
  act(() => {
    editor()!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    container.querySelector<HTMLElement>("[contenteditable]")!.focus();
  });
  expect(update).toHaveBeenCalledTimes(1);
});
test("Escape cancels changed draft and delayed autofocus cannot reopen it", () => {
  doubleClick();
  changeDraft();
  act(() => editor()!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  settle();
  expect(editor()).toBeNull();
  expect(update).not.toHaveBeenCalled();
});
test("selected row double-click works without a focus exception", () => {
  initiallySelected = true;
  act(() => { root.unmount(); root = createRoot(container); root.render(<Harness />); });
  doubleClick();
  expect(document.activeElement).toBe(editor());

  changeDraft();
  act(() => container.querySelector<HTMLElement>("[contenteditable]")!.focus());
  expect(update).toHaveBeenCalledTimes(1);
});
test("exception expires 600 ms after navigation, even if rename starts later", () => {
  routeDelay = 700;
  doubleClick();
  changeDraft();
  settle();
  expect(editor()).toBeNull();
  expect(update).toHaveBeenCalledTimes(1);
});
test("exception is consumed once; next programmatic composer blur commits", async () => {
  doubleClick();
  await act(async () => vi.advanceTimersByTime(300));
  expect(document.activeElement).toBe(editor());
  changeDraft();
  act(() => container.querySelector<HTMLElement>("[contenteditable]")!.focus());
  expect(update).toHaveBeenCalledTimes(1);
});
test("unmount during pending route focus does not recreate an editor", () => {
  doubleClick();
  act(() => root.render(<div />));
  settle();
  expect(editor()).toBeNull();
  expect(update).not.toHaveBeenCalled();
});
test("suppressed click cannot arm the focus exception", () => {
  suppressed = true;
  doubleClick();
  changeDraft();
  act(() => container.querySelector<HTMLElement>("[contenteditable]")!.focus());
  expect(navigate).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledTimes(1);
});
test("menu rename does not inherit a recent navigation exception", () => {
  click();
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="Menu Rename"]')!.click());
  expect(document.activeElement).toBe(editor());
  changeDraft();
  act(() => container.querySelector<HTMLElement>("[contenteditable]")!.focus());
  expect(update).toHaveBeenCalledTimes(1);
});
