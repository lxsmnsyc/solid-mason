# solid-mason

> Masonry layout for SolidJS

[![NPM](https://img.shields.io/npm/v/solid-mason.svg)](https://www.npmjs.com/package/solid-mason) [![Open in StackBlitz](https://img.shields.io/badge/Open%20in-StackBlitz-blue?style=flat-square&logo=stackblitz)](https://stackblitz.com//github/lxsmnsyc/solid-mason/tree/main/examples/demo)

<p align="center">
  <img
    src="https://raw.githubusercontent.com/lxsmnsyc/solid-mason/main/images/solid-mason.png"
    alt="A masonry grid of images at mixed aspect ratios"
    style="width: 80%; height: auto;"
  />
</p>

A masonry grid packs items of differing heights into columns without leaving
the gaps a plain column layout would. `solid-mason` measures each child and
places it into the shortest column at the time it is visited, then sizes the
container to its tallest column so the grid still occupies space in the
document flow.

## Install

```bash
npm i solid-mason
```

```bash
yarn add solid-mason
```

```bash
pnpm add solid-mason@next
```

## Requirements

This is the Solid 2 line, published under the `next` tag. For Solid 1, use
`solid-mason@latest` (the 0.2.x releases).

- `solid-js` and `@solidjs/web` 2.0.0-rc or later, as peer dependencies.
- A build that runs Solid's JSX compiler over the package. The package ships
  its JSX as written rather than code compiled for one renderer, so your own
  compiler builds it for your target, client or server alike.
  `@solidjs/vite-plugin` does this by default. A bundler that does not compile
  JSX in dependencies cannot import the package, and there is no CommonJS
  build for the same reason.

## Usage

```tsx
import { Mason } from 'solid-mason';

<Mason as="div" columns={5} items={photos()}>
  {(photo, index) => <Photo src={photo.src} index={index()} />}
</Mason>;
```

`items` is the data, and the child function renders one element per item. Every
prop `Mason` does not use is forwarded to the container element, so `class`,
`id`, event handlers and the rest work as they do on a plain `div`.

### Responsive columns

`createMasonryBreakpoints` watches a list of media queries and reports the
column count of the matching one, ready to hand to `columns`:

```tsx
import { Mason, createMasonryBreakpoints } from 'solid-mason';

const breakpoints = createMasonryBreakpoints(() => [
  { query: '(min-width: 1536px)', columns: 6 },
  { query: '(min-width: 1280px) and (max-width: 1536px)', columns: 5 },
  { query: '(min-width: 1024px) and (max-width: 1280px)', columns: 4 },
  { query: '(min-width: 768px) and (max-width: 1024px)', columns: 3 },
  { query: '(max-width: 768px)', columns: 2 },
]);

<Mason columns={breakpoints()} items={photos()}>
  {(photo) => <Photo src={photo.src} />}
</Mason>;
```

### Changing the container element

`as` picks the tag, and the props of that tag are type-checked:

```tsx
<Mason as="ul" columns={3} items={items()} aria-label="Gallery">
  {(item) => <li>{item.title}</li>}
</Mason>
```

## API

### `<Mason />`

| Prop       | Type                                               | Default | Description                                                      |
| ---------- | -------------------------------------------------- | ------- | ---------------------------------------------------------------- |
| `columns`  | `number`                                           | —       | Number of columns. Values below `1` are clamped to `1`.          |
| `items`    | `Data[] \| null \| undefined`                      | —       | Items to render, one child per item.                             |
| `children` | `(item: Data, index: () => number) => JSX.Element` | —       | Renders one item. `index` is an accessor, as with Solid's `For`. |
| `as`       | `keyof JSX.HTMLElementTags`                        | `'div'` | Tag name for the container element.                              |
| `style`    | `JSX.CSSProperties \| string`                      | —       | Extra container styles, merged with the ones the layout needs.   |
| `ref`      | `HTMLElement \| ((el: HTMLElement) => void)`       | —       | Receives the container element. Mason keeps its own as well.     |

Layout re-runs when `columns` changes, when the window resizes, and whenever
children are added, removed or reordered, always batched onto the next
animation frame.

### `createMasonryBreakpoints(breakpoints, defaultColumns?)`

Returns an accessor for the column count of the matching breakpoint.

- `breakpoints`: accessor for a list of `{ query, columns }`. Re-reading it
  re-subscribes, so the list can itself be reactive.
- `defaultColumns`: column count before any query matches. Defaults to `1`.

Breakpoints are evaluated in order, so when two queries match at the same time
the later one wins. Write them from widest to narrowest, or make them mutually
exclusive.

This reads `window.matchMedia`, so under SSR the accessor stays at
`defaultColumns` until hydration.

### `MASON_KEY`

The `data-solid-mason` attribute name. `Mason` writes the current column count
there, which gives a page or a test a way to find a container and read its
column count without reaching into the component.

## Notes

- Placement follows the shortest column **at insertion time**. It is not a
  balanced partition of the whole list, so the last column can end up noticeably
  shorter than the rest.
- A child has to have its final height on first paint. Content that grows
  afterwards, such as an image without a reserved aspect ratio, will overlap its
  neighbours until something else triggers another pass. Give media an
  `aspect-ratio` or an explicit height, as the demo does.
- Children are absolutely positioned, so margins on them collapse out of the
  layout. Pad the child's own wrapper instead.

## Demo

```bash
pnpm install
pnpm --filter demo dev
```

## Sponsors

![Sponsors](https://github.com/lxsmnsyc/sponsors/blob/main/sponsors.svg?raw=true)

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
