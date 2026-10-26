// @vitest-environment jsdom
import { renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { act, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useContext } from "react";
import { ListAnimationContext, ListReveal } from "../src/ListReveal";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

type Props = Parameters<typeof ListReveal>[0];
const props = (loaded: readonly boolean[], groupBy = "workspace"): Props => ({
  loaded,
  groupBy,
  children: <p>rows</p>,
});
const render = (initial: Props) => renderSlot({ component: ListReveal }, initial);
const shell = (view: ReturnType<typeof render>) =>
  view.getByText("rows").closest<HTMLElement>("[data-list-reveal]")!;
const hidden = (element: HTMLElement) =>
  element.style.visibility === "hidden" && element.getAttribute("aria-busy") === "true";

test("stays hidden until both stores have loaded, then reveals", () => {
  const view = render(props([false, false]));
  expect(hidden(shell(view))).toBe(true);
  view.rerender(<ListReveal {...props([true, false])} />);
  expect(hidden(shell(view))).toBe(true);
  view.rerender(<ListReveal {...props([true, true])} />);
  expect(hidden(shell(view))).toBe(false);
  expect(shell(view).hasAttribute("aria-busy")).toBe(false);
});

test("reveals at 600 ms when a store never loads", () => {
  const view = render(props([true, false]));
  act(() => { vi.advanceTimersByTime(599); });
  expect(hidden(shell(view))).toBe(true);
  act(() => { vi.advanceTimersByTime(1); });
  expect(hidden(shell(view))).toBe(false);
});

test("never hides again once revealed", () => {
  const view = render(props([true, true]));
  view.rerender(<ListReveal {...props([false, true])} />);
  act(() => { vi.advanceTimersByTime(1000); });
  expect(hidden(shell(view))).toBe(false);
});

const entrance = (view: ReturnType<typeof render>) => shell(view).getAttribute("data-grouping-entrance");

test("the grouping entrance plays only after groupBy changes", () => {
  const view = render(props([false, false], "workspace"));
  // A change while the stored view loads is the first paint, not a swap.
  view.rerender(<ListReveal {...props([true, true], "updated")} />);
  expect(entrance(view)).toBe("off");
  view.rerender(<ListReveal {...props([true, true], "updated")} />);
  expect(entrance(view)).toBe("off");
  view.rerender(<ListReveal {...props([true, true], "status")} />);
  expect(entrance(view)).toBe("on");
  // Back to the first grouping still plays: it is a user change.
  view.rerender(<ListReveal {...props([true, true], "updated")} />);
  expect(entrance(view)).toBe("on");
});

function AnimationProbe() {
  return <p>{useContext(ListAnimationContext) ? "animating" : "still"}</p>;
}

test("row animation stays off until the frame after the reveal", () => {
  const withProbe = (loaded: readonly boolean[]) => ({ ...props(loaded), children: <><p>rows</p><AnimationProbe /></> });
  const view = renderSlot({ component: ListReveal }, withProbe([false, true]));
  expect(view.getByText("still")).toBeTruthy();
  view.rerender(<ListReveal {...withProbe([true, true])} />);
  // The commit that reveals (and applies the stored order) must not slide.
  expect(hidden(shell(view))).toBe(false);
  expect(view.getByText("still")).toBeTruthy();
  act(() => { vi.advanceTimersToNextFrame(); });
  expect(view.getByText("animating")).toBeTruthy();
});
