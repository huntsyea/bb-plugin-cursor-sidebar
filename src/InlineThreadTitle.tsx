import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEventHandler,
} from "react";
import {
  useSdk,
  type PluginSidebarThread,
} from "@get-bb/plugin-sdk/app";
import { cn } from "@/lib/utils";
import { threadDisplayTitle, threadEditableTitle } from "./inbox";

/**
 * The row's title, which becomes an inline rename field on double-click.
 *
 * Derived from bb-plugin-thread-inbox (MIT, Copyright (c) 2026 Michael Yong);
 * see THIRD-PARTY-NOTICES.md at the repository root.
 */
export function InlineThreadTitle({
  thread,
  editing,
  selected,
  onEditingChange,
  className,
  onClick,
  onPointerDown,
}: {
  thread: PluginSidebarThread;
  editing: boolean;
  selected: boolean;
  onEditingChange: (editing: boolean) => void;
  className?: string;
  /** Return true only when this click starts navigation. */
  onClick?: (event: MouseEvent<HTMLElement>) => boolean;
  onPointerDown?: PointerEventHandler<HTMLElement>;
}) {
  const sdk = useSdk();
  const title = threadDisplayTitle(thread);
  const editableTitle = threadEditableTitle(thread);
  const [draft, setDraft] = useState(editableTitle);
  const finished = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasEditing = useRef(false);
  const recentNavigationUntil = useRef(0);
  const navigationFocusUntil = useRef(0);

  useEffect(() => {
    if (!editing) return;
    // Any new user intent ends the route-autofocus exception, including a
    // click in the composer or Tab out of the editor.
    const clear = () => { navigationFocusUntil.current = 0; };
    document.addEventListener("pointerdown", clear, true);
    document.addEventListener("keydown", clear, true);
    return () => {
      document.removeEventListener("pointerdown", clear, true);
      document.removeEventListener("keydown", clear, true);
    };
  }, [editing]);

  useEffect(() => {
    const entering = editing && !wasEditing.current;
    wasEditing.current = editing;
    // Seed the draft and take focus only on the transition into editing. A
    // realtime title echo mid-rename must not clobber what is being typed.
    if (!entering) return;
    setDraft(editableTitle);
    finished.current = false;
    // Commit-time autoFocus loses to the closing menu's focus restoration in
    // the same flush, leaving typed text nowhere; take focus after commit.
    inputRef.current?.focus({ preventScroll: true });
  }, [editing, editableTitle]);

  if (!editing) {
    return (
      <span
        title={title}
        className={cn(
          "pointer-events-auto relative z-10",
          className,
        )}
        onClick={(event) => {
          if (event.detail === 1) {
            recentNavigationUntil.current = !selected && !event.metaKey && !event.ctrlKey &&
              !matchMedia("(pointer: coarse)").matches ? performance.now() + 600 : 0;
          }
          const navigated = onClick?.(event);
          if (event.detail === 1 && !navigated) recentNavigationUntil.current = 0;
        }}
        onPointerDown={onPointerDown}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (matchMedia("(pointer: coarse)").matches) return;
          navigationFocusUntil.current = recentNavigationUntil.current;
          recentNavigationUntil.current = 0;
          onEditingChange(true);
        }}
      >
        {title}
      </span>
    );
  }
  const finish = (save: boolean) => {
    if (finished.current) return;
    finished.current = true;
    navigationFocusUntil.current = 0;
    onEditingChange(false);
    const next = draft.trim();
    if (save && next && next !== editableTitle) {
      void sdk.threads.update({ threadId: thread.id, title: next });
    }
  };
  return (
    <input
      autoFocus
      ref={inputRef}
      aria-label={`Rename ${title}`}
      value={draft}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          finish(true);
        } else if (event.key === "Escape") {
          event.preventDefault();
          finish(false);
        }
      }}
      onBlur={(event) => {
        // Consume only the first composer autofocus after this row navigated.
        // The deadline starts at the click, never at a later blur or render.
        const target = event.relatedTarget;
        if (performance.now() < navigationFocusUntil.current &&
          target instanceof HTMLElement && target.id === "thread-detail-follow-up-composer" &&
          target.getAttribute("contenteditable") === "true") {
          navigationFocusUntil.current = 0;
          const input = event.currentTarget;
          queueMicrotask(() => {
            if (!finished.current && input.isConnected && document.activeElement === target) {
              input.focus({ preventScroll: true });
            }
          });
          return;
        }
        finish(true);
      }}
      className={cn(
        "pointer-events-auto relative z-10 h-6 w-full min-w-0 rounded border border-border bg-background px-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
    />
  );
}
