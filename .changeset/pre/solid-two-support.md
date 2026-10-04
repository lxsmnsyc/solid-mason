---
'solid-mason': major
---

Support Solid 2 and ship the component as JSX.

- `solid-js` and `@solidjs/web` 2.0.0-rc are now the peer dependencies. Solid 1 is no longer supported on this line. Stay on `solid-mason@latest` (0.2.x) for Solid 1.
- The package resolves to a `.jsx` file under both the `solid` and `default` conditions. Your app's Solid compiler builds it for your target, so the same package works for client and server rendering. `@solidjs/vite-plugin` does this by default.
- There is no CommonJS build any more. A bundler that does not run Solid's JSX compiler over dependencies cannot import the package.
- The `solid-use` dependency is gone. Solid 2 has `omit` and `merge` built in, so the package now has no runtime dependencies.
- `items` is no longer watched directly. Layout runs when the container's child list changes, which is what every change to `items` produces, so a list that replaces nothing no longer triggers a pass.
- `MasonTag` is exported, which is the set of tag names `as` accepts.
