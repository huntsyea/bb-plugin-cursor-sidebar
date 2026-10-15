import { useEffect, useState } from "react";

/**
 * True once `loaded` has been true, or once `timeoutMs` has passed, whichever
 * comes first; it never goes back to false. The sidebar hides its list until
 * then, so the stored project order and view arrive before the first visible
 * paint instead of re-sorting the list in front of the user.
 */
export function useFirstLoad(loaded: boolean, timeoutMs: number): boolean {
  const [settled, setSettled] = useState(loaded);
  // Adjusting state during render: React re-renders before committing, so
  // the latch costs no extra commit.
  if (loaded && !settled) setSettled(true);
  useEffect(() => {
    if (settled) return;
    const timer = setTimeout(() => setSettled(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [settled, timeoutMs]);
  return settled;
}

/**
 * True once `value` has differed from what it was when `armed` first became
 * true; it never goes back to false. Computed during render, so an element
 * that mounts in the same render as the change already sees `true`.
 */
export function useChangedSinceArmed<T>(value: T, armed: boolean): boolean {
  const [baseline, setBaseline] = useState<{ value: T } | null>(null);
  const [changed, setChanged] = useState(false);
  if (armed && baseline === null) setBaseline({ value });
  if (!changed && baseline !== null && !Object.is(value, baseline.value)) setChanged(true);
  return changed;
}
