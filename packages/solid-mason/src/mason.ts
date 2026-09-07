import type { JSX } from 'solid-js';
import { For, createEffect, createSignal, mergeProps, on, onCleanup } from 'solid-js';
import type { DynamicProps } from 'solid-js/web';
import { Dynamic } from 'solid-js/web';
import { omitProps } from 'solid-use/props';
import type { MasonState } from './layout';
import {
  MASON_KEY,
  MASON_STYLE,
  MASON_STYLE_STRING,
  createMason,
  createMasonState,
} from './layout';

/**
 * Wraps `callback` so that repeated calls within one frame collapse into a
 * single call on the next animation frame.
 *
 * A masonry pass reads layout, so running it once per mutation record or once
 * per resize event would thrash. The pending frame is cancelled when the owning
 * reactive scope is disposed, which means this has to be called from inside one.
 *
 * @param callback Work to run at most once per frame.
 * @returns A function that schedules `callback`.
 */
function createRAFDebounce(callback: () => void): () => void {
  let timeout: number | undefined;

  onCleanup(() => {
    if (timeout !== undefined) {
      cancelAnimationFrame(timeout);
    }
  });

  return () => {
    if (timeout !== undefined) {
      cancelAnimationFrame(timeout);
    }

    timeout = requestAnimationFrame(() => {
      timeout = undefined;
      callback();
    });
  };
}

type OmitAndMerge<T, U> = T & Omit<U, keyof T>;

/**
 * Props for {@link Mason}, merged with the intrinsic props of the element named
 * by `as`. Anything not listed here is forwarded to that element.
 *
 * @typeParam Data Element type of the `items` array.
 * @typeParam T Tag name rendered for the container.
 */
export type MasonProps<Data, T extends keyof JSX.HTMLElementTags = 'div'> = OmitAndMerge<
  {
    /** Tag name for the container element. Defaults to `'div'`. */
    as?: T;
    /** Number of columns to lay out. Values below `1` are clamped to `1`. */
    columns: number;
    /** Items to render, one child per item. */
    items?: Data[] | null | undefined;
    /** Renders one item. `index` is an accessor, as with Solid's `For`. */
    children: (item: Data, index: () => number) => JSX.Element;
    /** Extra styles for the container, merged with the styles Mason needs. */
    style?: JSX.CSSProperties | string;
    /**
     * Receives the container element. Mason keeps its own reference as well,
     * so taking one here does not disturb the layout.
     */
    ref?: HTMLElement | ((el: HTMLElement) => void);
  },
  JSX.HTMLElementTags[T]
>;

/**
 * Masonry container.
 *
 * Children are rendered into a relatively positioned container and then
 * absolutely positioned into the shortest column at the time each is visited,
 * which packs items of differing heights without leaving the gaps a plain
 * column layout would. The container is sized to its tallest column so it still
 * takes up space in the document flow.
 *
 * Layout re-runs when `items` or `columns` change, when the window resizes, and
 * when children are added or removed, always batched onto the next animation
 * frame.
 *
 * ```tsx
 * <Mason as="section" columns={4} items={photos()}>
 *   {photo => <img src={photo.src} alt={photo.alt} />}
 * </Mason>
 * ```
 *
 * Two things to know:
 *
 * - Placement follows the shortest column *at insertion time*, so it is not a
 *   balanced partition of the whole list.
 * - A child has to have its final height on first paint. Content that grows
 *   afterwards, such as an image without a reserved aspect ratio, will overlap
 *   its neighbours until the next layout pass is triggered by something else.
 *
 * @typeParam Data Element type of the `items` array.
 * @typeParam T Tag name rendered for the container.
 */
export function Mason<Data, T extends keyof JSX.HTMLElementTags = 'div'>(
  props: MasonProps<Data, T>,
): JSX.Element {
  const [ref, setRef] = createSignal<HTMLElement>();

  createEffect(() => {
    const el = ref();
    if (!el) {
      return;
    }

    // Reading `props.columns` here is what makes a breakpoint change rebuild
    // the state and re-run the pass from scratch.
    const state: MasonState = createMasonState(props.columns);

    const recalculate = createRAFDebounce(() => {
      createMason(el, state);
    });

    createEffect(on(() => props.items, recalculate));

    window.addEventListener('resize', recalculate, { passive: true });
    onCleanup(() => {
      window.removeEventListener('resize', recalculate);
    });

    // `items` changing does not always mean the DOM has settled by the time the
    // effect runs, and children can also come and go without `items` changing
    // at all. Watching the child list covers both.
    const observer = new MutationObserver((mutations) => {
      if (mutations.length) {
        recalculate();
      }
    });

    observer.observe(el, { childList: true });

    onCleanup(() => {
      observer.disconnect();
    });
  });

  return Dynamic<T>(
    mergeProps(
      {
        get component() {
          return props.as ?? 'div';
        },
        ref(el: HTMLElement) {
          setRef(el);
          // `ref` arrives through the forwarded props too, and the forwarded
          // object wins the merge, so a caller's ref would otherwise replace
          // the one the layout pass depends on.
          const forwarded = (props as { ref?: unknown }).ref;
          if (typeof forwarded === 'function') {
            (forwarded as (value: HTMLElement) => void)(el);
          }
        },
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
            return { ...current, ...MASON_STYLE };
          }
          return MASON_STYLE_STRING;
        },
      },
      omitProps(props, ['as', 'children', 'columns', 'items', 'ref', 'style']),
    ) as unknown as DynamicProps<T>,
  );
}
