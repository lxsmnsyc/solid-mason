import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
  mergeProps,
  onCleanup,
} from 'solid-js';
import { Dynamic, DynamicProps } from 'solid-js/web';
import { omitProps } from 'solid-use';

type OmitAndMerge<T, U> = T & Omit<U, keyof T>;

type MasonProps<Data, T extends keyof JSX.HTMLElementTags = 'div'> = OmitAndMerge<{
  as?: T;
  columns: number;
  items?: Data[] | null | undefined;
  children: (item: Data, index: () => number) => JSX.Element;
  style?: JSX.CSSProperties | string;
}, JSX.HTMLElementTags[T]>;

function getShortestColumn(columns: number[]): number {
  let min = 0;
  let record = Number.MAX_SAFE_INTEGER;

  for (let i = 0, len = columns.length; i < len; i += 1) {
    if (columns[i] < record) {
      record = columns[i];
      min = i;
    }
  }

  return min;
}

function getLongestColumn(columns: number[]): number {
  let min = 0;
  let record = 0;

  for (let i = 0, len = columns.length; i < len; i += 1) {
    if (columns[i] > record) {
      record = columns[i];
      min = i;
    }
  }

  return min;
}

const MASON_STYLE: JSX.CSSProperties = {
  position: 'relative',
  width: '100%',
  'max-width': '100%',
};

const MASON_STYLE_STRING = ';position:relative;width:100%;max-width:100%;';

const MASON_KEY = 'data-solid-mason';

function getContentWidth(el: HTMLElement | SVGAElement) {
  const styles = getComputedStyle(el);

  return el.clientWidth
    - parseFloat(styles.paddingLeft)
    - parseFloat(styles.paddingRight);
}

function createMason(el: HTMLElement, columns: number) {
  // Set style
  el.style.position = 'relative';
  el.style.width = '100%';
  el.style.maxWidth = '100%';

  // Get computed style
  const containerWidth = getContentWidth(el);
  const widthPerColumn = containerWidth / columns;

  const columnHeights: number[] = new Array<number>(columns).fill(0);

  let node = el.firstElementChild;

  while (node) {
    if (node instanceof HTMLElement) {
      // Set the width of the node
      node.style.width = `${widthPerColumn}px`;
      // Set the position
      node.style.position = 'absolute';
      // Set the top/left
      const targetColumn = getShortestColumn(columnHeights);
      const currentColumnHeight = columnHeights[targetColumn];
      node.style.top = `${currentColumnHeight}px`;
      node.style.left = `${targetColumn * widthPerColumn}px`;
      // Increase column height
      node.getBoundingClientRect();
      const nodeHeight = node.offsetHeight;
      columnHeights[targetColumn] = currentColumnHeight + nodeHeight;
    }
    node = node.nextElementSibling;
  }
  const targetColumn = getLongestColumn(columnHeights);
  const currentColumnHeight = columnHeights[targetColumn];
  el.style.height = `${currentColumnHeight}px`;
}

function createRAFDebounce(callback: () => void): () => void {
  let timeout: number;

  onCleanup(() => {
    cancelAnimationFrame(timeout);
  });

  return () => {
    if (timeout) {
      cancelAnimationFrame(timeout);
    }

    timeout = requestAnimationFrame(() => callback());
  };
}
const MEDIA = new Map<string, MediaQueryList>();

function getMediaMatcher(query: string): MediaQueryList {
  const media = MEDIA.get(query);
  if (media) {
    return media;
  }
  const newMedia = window.matchMedia(query);
  MEDIA.set(query, newMedia);
  return newMedia;
}

export interface MasonryBreakpoint {
  query: string;
  columns: number;
}

export function createMasonryBreakpoints(
  breakpoints: () => MasonryBreakpoint[],
  defaultColumns = 1,
): () => number {
  const [columns, setColumns] = createSignal(defaultColumns);

  createEffect(() => {
    const br = breakpoints();
    for (let i = 0, len = br.length; i < len; i += 1) {
      const item = br[i];
      createMemo(() => {
        const media = getMediaMatcher(item.query);
        const callback = () => {
          if (media.matches) {
            setColumns(item.columns);
          }
        };
        callback();
        media.addEventListener('change', callback, false);
        onCleanup(() => {
          media.removeEventListener('change', callback, false);
        });
      });
    }
  });

  return columns;
}

export function Mason<Data, T extends keyof JSX.HTMLElementTags = 'div'>(
  props: MasonProps<Data, T>,
): JSX.Element {
  const [ref, setRef] = createSignal<HTMLElement>();

  createEffect(() => {
    const el = ref();
    if (el) {
      // eslint-disable-next-line no-unused-expressions
      props.items; // for tracking

      const recalculate = createRAFDebounce(() => {
        createMason(el, props.columns);
      });

      recalculate();

      window.addEventListener('resize', recalculate, { passive: true });

      onCleanup(() => window.removeEventListener('resize', recalculate));
    }
  });

  return Dynamic<T>(mergeProps(
    {
      get component() {
        return props.as ?? 'div';
      },
      ref: setRef,
      get children() {
        return For({
          get each() {
            return props.items;
          },
          children(item, index) {
            return Dynamic({
              component: 'div',
              get children() {
                return props.children(item, index);
              },
              style: {
                position: 'absolute',
              },
            });
          },
        });
      },
      get [MASON_KEY]() {
        return props.columns;
      },
      get style() {
        const current = props.style;
        if (typeof current === 'string') {
          return `${current}${MASON_STYLE_STRING}`;
        }
        if (current) {
          return { ...current, MASON_STYLE };
        }
        return MASON_STYLE_STRING;
      },
    },
    omitProps(props, ['as', 'children', 'columns', 'items', 'style']),
  ) as unknown as DynamicProps<T>);
}
