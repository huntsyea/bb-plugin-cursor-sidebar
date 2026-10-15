# Fork notes

Local fork of [wy3z/bb-plugin-cursor-sidebar](https://github.com/wy3z/bb-plugin-cursor-sidebar).
`main` is our branch. The `upstream` remote is fetch-only (push is disabled).

- **Base:** upstream `v0.2.1`
- **Installed in BB from:** this directory (`bb plugin install <path>`)

## Our changes

| Change | Main files |
|---|---|
| The list paints once, in its final order. It stays hidden (layout kept, `aria-busy`) until the stored project order and SidebarView have loaded, for at most 600 ms. | `src/useFirstLoad.ts`; a `loaded` flag in `src/useThreadOrders.ts`, `src/sidebar-view-controller.ts`, `src/useSidebarView.ts`, `src/sidebar-view.ts`; `src/CursorSidebar.tsx` |
| No motion on first paint: row animations (auto-animate) are off until a frame after the stored order applies, and the grouping-swap entrance only plays when `groupBy` changes. | `ListAnimationContext` in `src/AnimatedList.tsx`; `src/CursorSidebar.tsx` |

Keep the plugin id `cursor-sidebar`, because the plugin's database (`~/.bb/plugins/cursor-sidebar/data.db`) is keyed by it.

## Taking an upstream update

```sh
../sync-forks.sh                 # what upstream has that we don't
git merge vX.Y.Z                 # upstream releases are tags
# resolve conflicts, keeping both upstream's change and ours above
npx tsc --noEmit
npm run build && bb plugin reload cursor-sidebar
```
