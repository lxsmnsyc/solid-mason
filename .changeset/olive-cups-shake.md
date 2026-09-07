---
'solid-mason': minor
---

Fix layout bugs and rebuild the package with tsdown.

- `style` objects passed to `Mason` are now merged correctly. The layout styles
  were previously nested under a `MASON_STYLE` key instead of being spread, so
  an object `style` dropped `position: relative` and left children positioned
  against the page rather than the container.
- Stale measurements are dropped when the item list shrinks, so a removed child
  can no longer be matched against a later element on the next pass.
- `columns` values below `1` are clamped to `1` rather than dividing the
  container width by zero.
- A `ref` passed to `Mason` no longer replaces the reference the layout pass
  depends on. It used to arrive through the forwarded props and win the merge,
  which left the container unmeasured and the grid unpositioned.
- `MASON_KEY` is exported, along with the `MasonProps` type.

The build moved from pridepack to tsdown. Both the ESM and CommonJS builds are
still published, but the separate development build behind the `development`
export condition is gone: each format now has one file.
