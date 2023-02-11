# solid-mason

> Simple masonry layout in SolidJS

[![NPM](https://img.shields.io/npm/v/solid-mason.svg)](https://www.npmjs.com/package/solid-mason) [![JavaScript Style Guide](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript) [![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?style=flat-square&logo=codesandbox)](https://codesandbox.io/s/github/LXSMNSYC/solid-mason/tree/main/examples/demo)

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
import { Mason, createMasonryBreakpoints } from 'solid-mason';

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

- Masonry's layout order is based on the shortest column at the time a new element is being inserted.
- Each children must have a definite height on initial paint. Elements, like images, that changes height dynamically won't be re-adjused automatically by the mansory container.

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
