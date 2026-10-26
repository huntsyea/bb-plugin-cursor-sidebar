import type { ReactNode } from "react";
import { experimental_useThreadActions as useThreadActions, useBbNavigate, type PluginSidebarThread } from "@get-bb/plugin-sdk/app";
import { SidebarActions, type SidebarAction } from "./SidebarActions";
import { threadActionTarget, threadDisplayTitle } from "./inbox";
import { pinActionLabel } from "./pin-scope";
import type { RowSwipeBinding } from "./useRowGesture";

export function RowContextMenu({
  thread,
  onRename,
  onOpen,
  onToggleChildren,
  expanded,
  onTogglePin,
  isPinned,
  onRemoveFromFolder,
  swipeDisabled,
  onReorderStart,
  children,
}: {
  thread: PluginSidebarThread;
  onRename?: () => void;
  onOpen?: () => void;
  onToggleChildren?: () => void;
  expanded?: boolean;
  children: ReactNode;
  onTogglePin?: () => void;
  isPinned?: boolean;
  onRemoveFromFolder?: () => void;
  swipeDisabled?: boolean;
  /** Touch long-press pick-up for a reorder drag; true means it took over. */
  onReorderStart?: (pointerId: number, clientX: number, clientY: number) => boolean;
}) {
  const navigate = useBbNavigate();
  const native = useThreadActions(threadActionTarget(thread), {
    keys: ["bb--core/rename", "bb--core/read", "bb--core/archive", "bb--core/delete"],
    requestRename: onRename,
  });
  const rename = native.find((entry) => entry.key === "bb--core/rename")?.action;
  const read = native.find((entry) => entry.key === "bb--core/read")?.action;
  const archive = native.find((entry) => entry.key === "bb--core/archive")?.action;
  const deleteThread = native.find((entry) => entry.key === "bb--core/delete")?.action;
  // Native order (Open, Rename / read + pin / Archive, Delete) with the
  // family-scoped extras alongside their native cousins. Everything else is a
  // plain native call kept for parity.
  const actions: SidebarAction[] = [];
  actions.push({ label: "Open in split", run: () => { navigate.toThread(thread.id, { split: true }); onOpen?.(); } });
  // Host actions appear only when the host offers them, disabled when it says so.
  if (onRename && rename) actions.push({ label: "Rename", run: () => void rename.run(), disabled: rename.disabled });
  if (onToggleChildren) actions.push({ label: expanded ? "Collapse children" : "Expand children", run: onToggleChildren });
  if (read) actions.push({ label: thread.isUnread ? "Mark read" : "Mark unread", run: () => void read.run(), disabled: read.disabled, separatorBefore: true });
  if (onTogglePin) {
    actions.push({ label: pinActionLabel(isPinned ?? false), run: onTogglePin });
  }
  if (onRemoveFromFolder) actions.push({ label: "Remove family from folder", run: onRemoveFromFolder });
  if (archive) actions.push({ label: "Archive", run: () => void archive.run(), disabled: archive.disabled, separatorBefore: true });
  if (deleteThread) actions.push({ label: "Delete", run: () => void deleteThread.run(), disabled: deleteThread.disabled, destructive: true, separatorBefore: !archive });
  // Pin towards the end of the row, archive the other way: pinning is
  // reversible and worth keeping, archiving takes the row away.
  const swipe: RowSwipeBinding | undefined = swipeDisabled
    ? undefined
    : {
        ...(onTogglePin !== undefined
          ? {
              left: {
                label: pinActionLabel(isPinned ?? false),
                icon: isPinned ? "PinOff" : "Pin",
                run: onTogglePin,
              },
            }
          : {}),
        ...(archive && !archive.disabled
          ? {
              right: {
                label: "Archive",
                icon: "Archive",
                destructive: true,
                run: () => void archive.run(),
              },
            }
          : {}),
      };
  // No hold action: on touch a hold opens this menu, and the menu carries the
  // children toggle. A row with children used to spend its hold on expanding
  // them, which left rename, read, pin, archive and delete out of reach on a
  // phone.
  return (
    <SidebarActions label={threadDisplayTitle(thread)} onReorderStart={onReorderStart} actions={actions} swipe={swipe}>
      {children}
    </SidebarActions>
  );
}
