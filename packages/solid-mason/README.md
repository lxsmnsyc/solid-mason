# solid-mason

> Simple masonry layout in SolidJS

[![NPM](https://img.shields.io/npm/v/stellis.svg)](https://www.npmjs.com/package/stellis) [![JavaScript Style Guide](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript) [![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?style=flat-square&logo=codesandbox)](https://codesandbox.io/s/github/LXSMNSYC/solid-popper/tree/main/examples/solid-popper-demo)

<p align="center">
  <img
    src="https://raw.githubusercontent.com/lxsmnsyc/solid-mason/main/images/solid-mason.png"
    alt="Example"
    style="width: 80%; height: auto;"
  />
</p>

## Install

```bash
npm install --save solid-mason
```

```bash
yarn add solid-mason
```

```bash
pnpm add solid-mason
```

## Usage

### Basic example

```js
import { Mason } from 'solid-mason';

<Mason
  as="div"
  items={someArray}
  columns={5}
>
  {(item, index) => <MyImage />}
</Mason>
```

### Breakpoints example

```js
import { Mason, createMasonBreakpoints } from 'solid-mason';

const breakpoints = createMasonryBreakpoints(() => [
  { query: '(min-width: 1536px)', columns: 6 },
  { query: '(min-width: 1280px) and (max-width: 1536px)', columns: 5 },
  { query: '(min-width: 1024px) and (max-width: 1280px)', columns: 4 },
  { query: '(min-width: 768px) and (max-width: 1024px)', columns: 3 },
  { query: '(max-width: 768px)', columns: 2 },
]);

<Mason
  as="div"
  items={someArray}
  columns={breakpoints()}
>
  {(item, index) => <MyImage />}
</Mason>
```

## Notes

- Masonry's layout order is based on the shortest column when a new element is being calculated width.
- Each children must have a pre-calculated height. Width is already provided by the masonry, but height is crucial for resolving columnar layouts.

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
