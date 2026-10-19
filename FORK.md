# Fork notes

Local fork of [wy3z/bb-plugin-cursor-sidebar](https://github.com/wy3z/bb-plugin-cursor-sidebar).
`main` is our branch, pushed to `origin` ([huntsyea/bb-plugin-cursor-sidebar](https://github.com/huntsyea/bb-plugin-cursor-sidebar)).
The `upstream` remote is fetch-only (push is disabled).

- **Base:** original upstream `v0.2.1` history at `f85a292`, preserved as `fork-history/v0.2.1-original`
- **Integrated release:** upstream `v0.2.3` at `a799844`, merged with both parent histories intact for BBP-21.
- **Installed in BB from:** this directory (`bb plugin install <path>`)

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
../sync-forks.sh                 # what upstream has that we don't
git merge vX.Y.Z                 # upstream releases are tags
# resolve conflicts, keeping both upstream's change and ours above
npx tsc --noEmit
git push                         # to origin (our fork)
npm run build && bb plugin reload cursor-sidebar
```

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
