# solid-mason

## 1.0.0-next.0

### Major Changes

- c6d4b28: Support Solid 2 and ship the component as JSX.

  - `solid-js` and `@solidjs/web` 2.0.0-rc are now the peer dependencies. Solid 1 is no longer supported on this line. Stay on `solid-mason@latest` (0.2.x) for Solid 1.
  - The package resolves to a `.jsx` file under both the `solid` and `default` conditions. Your app's Solid compiler builds it for your target, so the same package works for client and server rendering. `@solidjs/vite-plugin` does this by default.
  - There is no CommonJS build any more. A bundler that does not run Solid's JSX compiler over dependencies cannot import the package.
  - The `solid-use` dependency is gone. Solid 2 has `omit` and `merge` built in, so the package now has no runtime dependencies.
  - `items` is no longer watched directly. Layout runs when the container's child list changes, which is what every change to `items` produces, so a list that replaces nothing no longer triggers a pass.
  - `MasonTag` is exported, which is the set of tag names `as` accepts.

## 0.2.0

### Minor Changes

- bd03228: Fix layout bugs and rebuild the package with tsdown.

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
