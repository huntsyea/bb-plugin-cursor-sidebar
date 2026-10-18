# Fork notes

Local fork of [wy3z/bb-plugin-cursor-sidebar](https://github.com/wy3z/bb-plugin-cursor-sidebar).
`main` is our branch, pushed to `origin` ([huntsyea/bb-plugin-cursor-sidebar](https://github.com/huntsyea/bb-plugin-cursor-sidebar)).
The `upstream` remote is fetch-only (push is disabled).

- **Base:** original upstream `v0.2.1` history at `f85a292`, preserved as `fork-history/v0.2.1-original`
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
