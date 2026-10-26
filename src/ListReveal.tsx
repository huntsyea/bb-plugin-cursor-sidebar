import { createContext, useEffect, useState, type ReactNode } from "react";
import "./list-reveal.css";

/** Upper bound on hiding the list while its stored inputs load. */
const REVEAL_TIMEOUT_MS = 600;

/**
 * Whether lists may animate. Off while the list is hidden and for the commit
 * that reveals it, so the first arrangement appears in place instead of
 * sliding there; on from the next frame. AnimatedList reads it.
 */
export const ListAnimationContext = createContext(true);

/**
 * The sidebar list's first paint (fork-owned; see FORK.md). The list stays
 * hidden, layout kept and `aria-busy`, until every stored input it sorts by
 * has loaded, or for at most 600 ms, so it paints once in its final order.
 * The grouping-swap entrance is for changing groupBy, not for that first
 * paint: `list-reveal.css` holds it off until groupBy differs from the value
 * it had when the list revealed.
 */
export function ListReveal({
  loaded,
  groupBy,
  children,
}: {
  /** One flag per stored input; the list reveals once all are true. */
  loaded: readonly boolean[];
  /** The view's grouping; a change after the reveal plays the entrance. */
  groupBy: string;
  children: ReactNode;
}) {
  const allLoaded = loaded.every(Boolean);
  const [ready, setReady] = useState(allLoaded);
  // Adjusting state during render: React re-renders before committing, so
  // the latch costs no extra commit. It never goes back to false.
  if (allLoaded && !ready) setReady(true);
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setReady(true), REVEAL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [ready]);
  // auto-animate reacts to DOM mutations after the commit that made them, so
  // turn animation on a frame later: the commit that applied the order and
  // revealed the list must not slide.
  const [animate, setAnimate] = useState(ready);
  useEffect(() => {
    if (!ready || animate) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [animate, ready]);
  // Computed during render, so the regrouped list that mounts in the same
  // render as the change already sees the entrance on.
  const [baseline, setBaseline] = useState<{ groupBy: string } | null>(null);
  const [regrouped, setRegrouped] = useState(false);
  if (ready && baseline === null) setBaseline({ groupBy });
  if (!regrouped && baseline !== null && groupBy !== baseline.groupBy) setRegrouped(true);
  return (
    <div
      data-list-reveal=""
      aria-busy={ready ? undefined : true}
      style={ready ? undefined : { visibility: "hidden" }}
      data-grouping-entrance={regrouped ? "on" : "off"}
      className="flex min-h-0 flex-1 flex-col"
    >
      <ListAnimationContext.Provider value={animate}>{children}</ListAnimationContext.Provider>
    </div>
  );
}
