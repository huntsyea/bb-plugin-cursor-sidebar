import {
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
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
  onEditingChange,
  className,
  onClick,
  onPointerDown,
}: {
  thread: PluginSidebarThread;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  onPointerDown?: PointerEventHandler<HTMLElement>;
}) {
  const sdk = useSdk();
  const title = threadDisplayTitle(thread);
  const editableTitle = threadEditableTitle(thread);
  const [draft, setDraft] = useState(editableTitle);
  const finished = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasEditing = useRef(false);
  const pendingClick = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingClick = () => {
    if (pendingClick.current !== null) clearTimeout(pendingClick.current);
    pendingClick.current = null;
  };
  useEffect(() => cancelPendingClick, []);

  useEffect(() => {
    const entering = editing && !wasEditing.current;
    wasEditing.current = editing;
    // Seed the draft and take focus only on the transition into editing. A
    // realtime title echo mid-rename must not clobber what is being typed.
    if (!entering) return;
    cancelPendingClick();
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
          event.preventDefault();
          cancelPendingClick();
          // Keyboard, split-open modifiers and touch have no rename gesture.
          if (event.detail === 0 || event.metaKey || event.ctrlKey || matchMedia("(pointer: coarse)").matches) {
            onClick?.(event);
            return;
          }
          if (event.detail > 1) return;
          // Let a second click claim rename before navigation can move focus
          // to the composer and blur (save/close) the new editor.
          pendingClick.current = setTimeout(() => {
            pendingClick.current = null;
            onClick?.(event);
          }, 500);
        }}
        onPointerDown={onPointerDown}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          cancelPendingClick();
          if (matchMedia("(pointer: coarse)").matches) return;
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
      onBlur={() => finish(true)}
      className={cn(
        "pointer-events-auto relative z-10 h-6 w-full min-w-0 rounded border border-border bg-background px-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
    />
  );
}
