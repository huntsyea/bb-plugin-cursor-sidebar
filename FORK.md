# Fork notes

Local fork of [wy3z/bb-plugin-cursor-sidebar](https://github.com/wy3z/bb-plugin-cursor-sidebar).
`main` is our branch, pushed to `origin` ([huntsyea/bb-plugin-cursor-sidebar](https://github.com/huntsyea/bb-plugin-cursor-sidebar)).
The `upstream` remote is fetch-only (push is disabled).

- **Base:** original upstream `v0.2.1` history at `f85a292`, preserved as `fork-history/v0.2.1-original`
- **Integrated release:** upstream `v0.2.4` at `b21b6cf`, merged with both parent histories intact for BBP-22.
- **Installed in BB from:** `/Users/huntsyea/Dev/bb-plugins/bb-plugin-cursor-sidebar`, on `main` at v0.2.2 as of 2026-10-20. The v0.2.4 candidate remains on `sync/BBP-22`; do not install from the preparation worktree.

## Requirements — 2026-10-20

The `sync/BBP-22` manifest requires BB `>=0.42` and Plugin SDK `>=0.6.49`.
The README's BB 0.42 minimum still matches; its upstream Git install example
does not select this fork. The installed `main` manifest still declares SDK
`>=0.4.47`. These engine ranges are manifest requirements; the prepared
candidate still needs the approved runtime checks below.

## Our changes

| Change | Main files |
|---|---|
| The list paints once, in its final order. It stays hidden (layout kept, `aria-busy`) until the stored project order and SidebarView have loaded, for at most 600 ms. | `src/useFirstLoad.ts`; a `loaded` flag in `src/useThreadOrders.ts`, `src/sidebar-view-controller.ts`, `src/useSidebarView.ts`, `src/sidebar-view.ts`; `src/CursorSidebar.tsx` |
| No motion on first paint: row animations (auto-animate) are off until a frame after the stored order applies, and the grouping-swap entrance only plays when `groupBy` changes. | `ListAnimationContext` in `src/AnimatedList.tsx`; `src/CursorSidebar.tsx` |

Keep the plugin id `cursor-sidebar`, because the plugin's database (`~/.bb/plugins/cursor-sidebar/data.db`) is keyed by it.

## Taking an upstream update

Before merging a release, compare `git rev-parse refs/tags/vX.Y.Z` with
`git ls-remote upstream refs/tags/vX.Y.Z`. The tag object IDs must match.

```sh
bash "/Users/huntsyea/Dev/bb-plugins/sync-forks.sh"
```

The root [sync-forks.sh](/Users/huntsyea/Dev/bb-plugins/sync-forks.sh)
fetches and reports upstream changes; it does not merge or deploy.
Prepare the selected tag in an isolated `sync/<KEY>` worktree. Preserve the
fork changes above, record the rollback commit, and validate the candidate
there. Report conflicts, results, and engine/SDK compatibility to Warden.
Follow the [Warden reload protocol (ADR-0001)](/Users/huntsyea/Dev/bb-plugins/docs/adr/0001-warden-reload-approval.md)
for approval, fast-forward, deployment order, and runtime checks.

## v0.2.1 history correction (2026-10-18)

Upstream rewrote its release history after our clone. The two v0.2.1 release
commits have identical tree `fc1cbc976ee5597408c34d39595d2eaaee9a5ef1`, but
different parents. The actor and exact rewrite time are unknown.

| Release identity | Annotated tag object | Target commit |
|---|---|---|
| Original release: `fork-history/v0.2.1-original` | `0424a8322c1b735e61a90f679e2f172d2ddc0637` | `f85a292588d42cfff970aaa303cd40130516df62` |
| Current upstream release: `v0.2.1` | `843dbd6fee787dadd7caccda4774fa9803b721ae` | `19a7852464d886dbdd41c41c6ad634c36ca66190` |

Per Hunter's decision on BBP-3, we preserved the original annotated tag object
locally and on origin, and verified the archive on origin before changing
`v0.2.1`. We then replaced `v0.2.1` locally and on origin with upstream's
exact tag object. Only `v0.2.1` was force-updated. The archive retains the
original annotation, including its internal `v0.2.1` name.

Our `main` history and fork patches still descend from the original release.
This tag correction did not merge upstream or build, install, or reload the
plugin. Review future merges across the rewritten ancestry manually.

## BBP-6 preparation (2026-10-18)

Rollback commit: `cad09417609bd75248d18282eaf40f448e61bc63`.
Prepared on `sync/BBP-6` in a separate worktree. The merge includes uploaded
project icons and the icon CLI. It also joins the rewritten upstream history,
including the native Add Project dialog and second-click project collapse.
Those two behaviours were already present in the original v0.2.1 release tree.

Conflicts were limited to release versions in `package.json` and
`package-lock.json`, plus added imports in `src/CursorSidebar.tsx` and
`src/server.ts`. Keep the upstream 0.2.2 versions and imports. Both fork
behaviours above remain unchanged; the plugin ID remains `cursor-sidebar`.

`npm ci`, `npm run typecheck`, and `npm run build` passed in the worktree.
No test script is declared. Typecheck matches the October 18 baseline; the
baseline did not run a build. BB 0.46.1 satisfies `engines.bb >=0.42` and
its SDK 0.6.49 satisfies `engines.bbPluginSdk >=0.4.47`. The development SDK
pin remains 0.4.47; the build warns about this difference and stamps SDK
0.6.49 in both artifact manifests. Runtime behaviour is not yet verified.

No install or reload is part of this preparation. After Hunter approves,
verify that main can fast-forward to the reviewed branch, fast-forward main,
build in the main checkout, then reload under Warden's protocol. Until then,
keep the main checkout and its build output untouched.

## BBP-21 preparation (2026-10-19)

Rollback commit: `2f996e8142d0cf4a3d9cca3fd767da2a468fc3ae`.
Prepared on `sync/BBP-21` in an isolated worktree, with a normal two-parent
merge of verified upstream tag `v0.2.3` (`a7998444cc5fc1d5a4a19d6cb9f3d1ebaf537dc6`).
The merge had no conflicts. Upstream adds optional Workspaces integration:
workspace chats nest under their anchor (named first chat, otherwise oldest),
and the anchor shows the workspace name. Shared-worktree top-level chats also
group when Workspaces is running. Native parent links remain unchanged.
Without the Workspaces plugin, the integration leaves the list unchanged.

The first-paint readiness and deferred-animation patches remain intact.
Workspace metadata loads separately from the stored order/view readiness gate;
check late nesting and animation after reload. No new abstraction or duplicate
fork logic is added. The plugin ID remains `cursor-sidebar`.

Preparation does not change main, its dist/output, or the install source, and
does not reload the plugin. After Warden approval, verify clean main at the
rollback commit and fast-forward eligibility, fast-forward main to the reviewed
branch, run `npm ci`, build, then reload `cursor-sidebar` under Warden protocol.
Verify running status, logs, workspace nesting/names with and without Workspaces,
stored order/view first paint, deferred row animation, and grouping changes.
If rollback is needed, restore the rollback commit, run `npm ci`, build and reload
under the same approval protocol.

### SDK bump deferred: breaking action API

The separate SDK 0.6.49 bump was attempted, then withdrawn under the task's
stop-if-risky condition. npm ci succeeded (105 packages, zero audit findings),
but typecheck failed with seven diagnostics. SDK 0.6.49 removes
experimental_useSidebarThreadActions, used by CursorSidebar,
InlineThreadTitle, RowContextMenu, and ThreadTree. The replacement
experimental_useThreadActions(thread, options) returns bound menu entries;
it is not a compatible rename. The old hook handles navigation, creation,
pinning/read state, rename, archive, and delete confirmation. Migrating these
calls changes runtime behavior and needs a separate reviewed migration.
The SDK also makes PluginSidebarThread.displayTitle required, conflicting
with the local optional override in inbox.ts (three diagnostics).

The development pin and lockfile stay at 0.4.47. There is no SDK bump commit,
and the build's SDK mismatch warning remains. Do not treat this branch as
completion of the requested combined release. Warden must resolve the SDK
migration or explicitly accept an upstream-only release before reload.

### Final validation

With the original SDK pin restored, npm ci (99 packages, zero audit findings),
npm run typecheck, and npm run build passed in the worktree. No test suite or
test script exists; no automated behavior tests ran. The SDK pin warning and
Node module.register deprecation warning remain. npm also reports deprecated
prebuild-install and missing allowScripts coverage for better-sqlite3.
A temporary npm cache was used because the default cache was not writable.

BB 0.46.1 satisfies engines.bb >=0.42. Host SDK 0.6.49 satisfies
engines.bbPluginSdk >=0.4.47. These ranges pass but do not prove compatibility
of the removed experimental action API. Both generated manifests identify
cursor-sidebar 0.2.3, BB 0.46.1, and SDK 0.6.49.
Six fork patch files are byte-identical to main; CursorSidebar's fork additions
and removals match the prior fork patch. Main remains clean at the rollback
SHA and all seven dist artifacts have unchanged hashes. Live behavior,
including action menus and confirmation, remains unverified until an approved
reload. The worktree is removed after pushing; the branch is retained.


## BBP-22 SDK migration (2026-10-19)

This section supersedes the BBP-21 SDK deferral above. `sync/BBP-22`, based on
`origin/sync/BBP-21` at `80d1193`, is the combined v0.2.3 and SDK migration
reload candidate. Rollback remains `2f996e8142d0cf4a3d9cca3fd767da2a468fc3ae`.

### Live runtime finding (read-only)

The installed main bundle uses `globalThis.__bbPluginRuntime.pluginSdkApp`;
it does not bundle the SDK implementation. In installed BB 0.46.1,
`app/dist/assets/plugin-frontend-DcgNBrkv.js` exports
`experimental_useSidebarThreadActions: on` and installs that export object
as `pluginSdkApp`. Its import resolves to `AQ` in `index-DLL4t6p_.js`.
`AQ` still implements open, openNewThread, setPinned, setRead, rename,
archive, and requestDelete. Thus the live plugin receives the old hook,
even though SDK 0.6.49 declarations no longer expose it. The plugin reports
running with zero handler errors; `bb plugin logs cursor-sidebar` returned
no entries. This establishes runtime API availability, not an interaction
test. No live UI was used. Priority stays medium; no urgent alert was needed.

Fetched upstream and inspected its remote branches and recent commits.
Main remains `a799844` (v0.2.3); none of the fetched upstream branches uses
`experimental_useThreadActions`. There was no upstream migration to reuse.

### Action migration

| Behavior | SDK 0.6.49 implementation |
|---|---|
| Open row, parent link, modifier-click split, menu split | `useBbNavigate().toThread`, preserving split options and navigation callbacks. |
| New personal/project chat | `toCompose`, preserving explicit project selection and prompt focus. |
| Pin/unpin family and unpin during folder moves | `useSdk().threads.pin/unpin`; keep the existing write plan, unchanged-state check, and partial-failure reporting. |
| Read/unread row | Bound `bb--core/read` action. Bulk mark-read uses `threads.markRead` and keeps per-thread failure reporting. |
| Rename | Bound `bb--core/rename` starts the existing inline editor through `requestRename`; saving uses `threads.update`. Double-click, Enter, blur, Escape, and trim rules remain. |
| Archive menu, hover control, swipe | Bound `bb--core/archive`, preserving host child confirmation, pane cleanup, and Undo. |
| Delete menu | Bound `bb--core/delete`, preserving the host confirmation flow. No direct delete call. |

The development SDK is pinned to 0.6.49. The minimum SDK engine is also
0.6.49, so an older host cannot accept this candidate based on the former
0.4.47 range. Removed the optional displayTitle override; use the required
SDK field while retaining local mention expansion and workspace labels.
A shared pure target conversion handles sidebar environments with null ids.
It avoids duplicate conversion code and unsafe type assertions. Navigation,
writes, and lifecycle actions stay with their existing host responsibilities;
no replacement action framework or extra UI is added (KISS, DRY, YAGNI).

All six separate first-paint/animation patch files match BBP-21 unchanged.
CursorSidebar changes only action imports, calls, and hook dependencies;
its readiness gate, 600 ms bound, aria-busy state, deferred row animation,
and grouping-change entrance behavior remain intact. Plugin id is unchanged.

### Validation and manual checks after the approved reload

`npm ci`, `npm run typecheck`, and `npm run build` passed. Audit found zero
vulnerabilities. There is no SDK mismatch warning. Remaining tooling warnings
are Node module.register deprecation, deprecated prebuild-install, and
better-sqlite3 install-script allowScripts coverage. No test suite exists;
no automated interaction tests ran. Build manifests identify cursor-sidebar
0.2.3 and SDK 0.6.49. The checks below are pending, not verified outcomes.

1. **Open:** click and keyboard-open a row; open a detached parent link.
   Cmd/Ctrl-click and menu Open in split must open or focus the correct pane.
   Check compact layout and sidebar dismissal through onNavigate.
2. **New thread:** use Today +, a project header +, and the project picker.
   Verify the intended personal/project selection, focused prompt, and default
   unpinned placement outside folders, even after using a different project.
3. **Pin:** use hover, menu, and swipe to pin/unpin a single thread and a family.
   Pinning must lift the family root; unpinning must clear pinned descendants.
   Move a pinned family to a folder and check its unpin behavior. On a failed
   write, verify partial-failure reporting and no false success message.
4. **Read:** toggle read/unread in the row menu and verify indicators and menu
   labels. Mark all read must affect only the eligible ordinary threads.
   On a failed write, verify the reported successful/failed counts.
5. **Rename:** use menu Rename and desktop double-click. Check editor focus,
   Enter and blur save once, Escape cancels, and empty/unchanged input does not
   save. A realtime title update must not replace an active draft. Check
   fallback titles, thread mentions, and workspace display names separately
   from the persisted editable title.
6. **Archive:** use menu, hover button, and swipe on disposable single threads
   and parents with children. Check the host child decision, cancel, removal,
   active route/split cleanup, and Undo restoration. Verify the dialog remains
   usable after the custom menu closes, including on touch.
7. **Delete:** on disposable single threads and parents, open Delete from the
   menu. Nothing must disappear before confirmation; cancel must preserve
   data. Confirm only on disposable fixtures and check the host child options,
   final removal, and route/pane cleanup. Check compact/touch confirmation.
8. **Menu access:** compare right-click, Actions button, Shift+F10, and touch
   long-press. Keep the same action order, separators, family/folder actions,
   child expand/collapse behavior, and drag/swipe interaction.
9. **v0.2.3 and fork patches:** check workspace anchor nesting/names with and
   without Workspaces, native parents, and shared-worktree grouping. Verify
   late workspace metadata does not cause unwanted animation. With saved
   ordering and view settings, check stable first paint, bounded reveal,
   aria-busy clearing, no initial motion, later reorder motion, and entrance
   only when groupBy changes. Check cold load and reconnect.
10. **Host health:** verify cursor-sidebar is running, inspect plugin logs and
    frontend errors, and confirm no missing-hook or SDK mismatch error.
11. **v0.2.4 row alignment:** without Workspaces, check that thread dots align
    under project icons and thread titles align with project names. Check
    parent dots, hover chevrons, child rails, detached-parent links, and Show
    more indentation. Check uploaded and default 16 px project icons and the
    project header Plus icon. Repeat with nested children, compact/touch
    layouts, and Workspaces when available.

### Reload plan (not executed)

This candidate replaces `sync/BBP-21`; ship v0.2.4 and the SDK migration in
one reviewed reload. After Warden approval, verify clean main at `2f996e8`,
verify it is an ancestor of the reviewed `sync/BBP-22` tip, fast-forward main
to that tip, run `npm ci` and build in main, then reload cursor-sidebar under
Warden protocol. Run the checks above. Do not change the install source.
For rollback, restore `2f996e8`, run `npm ci` and build, then reload under the
same protocol. The rollback build is expected to warn about its old SDK pin.

Preparation leaves main, all seven dist artifact hashes, the output inventory,
and the install source unchanged. No install or reload is performed. Push the
branch, retain it for review, and remove only this task worktree after verifying
all tracked changes are committed and the remote tip matches.

## BBP-22 v0.2.4 follow-up (2026-10-20)

The single reload candidate is now `sync/BBP-22`: upstream v0.2.4 plus the
SDK 0.6.49 migration. Rollback remains `2f996e8`. This supersedes the earlier
v0.2.3 candidate description. No reload is requested or performed.

The local tag and upstream tag both resolve to
`b21b6cf864aae481f39a47540611550cb30e0ee4`. Normal two-parent merge `0311c22`
joins that release to migration commit `e54cd00`.
Upstream commit `3f08147` aligns thread rows with project headings: row padding
and rail origins move from 8 to 12 px, detached-parent and Show more labels
move by 4 px, project icons become 16 px, and the project new-chat icon is Plus.
These styles are unconditional; the changes apply without Workspaces.
The installed plugin list has no Workspaces entry. This is source verification;
the new layout has not been checked in the live UI.

There were no conflicts. Git merged ThreadTree, CursorSidebar, and both
package files automatically. The source diff against `e54cd00` contains only
the upstream layout/icon changes. The migrated navigation and bound actions
remain intact. The six separate first-paint/animation patch files are
byte-identical to main; the readiness and animation code in CursorSidebar
is unchanged. The SDK development pin and minimum engine remain 0.6.49.
Keeping the existing layout and action mechanisms avoids extra abstractions
and duplicate logic (KISS, DRY, YAGNI); host action responsibilities stay intact.

`npm ci`, `npm run typecheck`, `npm run build`, and `git diff --check` pass.
Audit reports zero vulnerabilities. Both build manifests identify plugin
0.2.4, SDK 0.6.49, and BB 0.46.1. There is no SDK mismatch warning.
Remaining warnings concern deprecated prebuild-install, better-sqlite3
allowScripts coverage, and Node module.register deprecation.
No test suite exists. The manual checks above remain pending an approved
reload. Preparation keeps main at `2f996e8`, its dist/output unchanged,
and the install source unchanged.

## BBP-28 immediate navigation and inline rename

The replacement candidate on `fix/BBP-28` starts from `df0a63b`, which is also
its rollback point. It reuses the BBP-27 test harness and development dependencies
through a partial cherry-pick of `09e16b8`; it does not include that candidate's
500 ms navigation delay or the unrelated BBP-27 diagnosis.

Title clicks navigate synchronously. An inactive-row double-click can consume
one programmatic focus transfer to the host's follow-up composer, for at most
600 ms from the navigation click. A new pointer or keyboard event ends this
exception. Other blur targets, menu rename, suppressed navigation, selected-row
rename and expired transitions retain normal save/cancel behavior. The host
composer element identity is an integration dependency; verify it after host
updates. The bounded exception deliberately does not retain focus indefinitely
when route completion takes longer than 600 ms.

This keeps navigation in ThreadTree and editing in InlineThreadTitle, with one
boolean callback result to identify accepted navigation. No extra state manager
or navigation timer is added. Unit and isolated browser evidence is attached to
BBP-28. Preparation does not reload the plugin or change its install source.
