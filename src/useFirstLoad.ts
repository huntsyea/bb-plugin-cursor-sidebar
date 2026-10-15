import { useEffect, useState } from "react";

/**
 * True once `loaded` has been true, or once `timeoutMs` has passed, whichever
 * comes first; it never goes back to false. The sidebar hides its list until
 * then, so the stored project order and view arrive before the first visible
 * paint instead of re-sorting the list in front of the user.
 */
export function useFirstLoad(loaded: boolean, timeoutMs: number): boolean {
  const [timedOut, setTimedOut] = useState(false);
  const [done, setDone] = useState(loaded);
  useEffect(() => {
    if (loaded) setDone(true);
  }, [loaded]);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [timeoutMs]);
  return done || loaded || timedOut;
}
