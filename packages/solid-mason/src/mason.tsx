import type { ComponentProps, JSX } from '@solidjs/web';
import { For, dynamic } from '@solidjs/web';
import { createEffect, createSignal, merge, omit } from 'solid-js';
import type { MasonState } from './layout';
import {
  MASON_KEY,
  MASON_STYLE,
  MASON_STYLE_STRING,
  createMason,
  createMasonState,
} from './layout';

type OmitAndMerge<T, U> = T & Omit<U, keyof T>;

/** Tag names `Mason` can render as. */
export type MasonTag = keyof JSX.HTMLElementTags;

/**
 * Props for {@link Mason}, merged with the intrinsic props of the element named
 * by `as`. Anything not listed here is forwarded to that element.
 *
 * @typeParam Data Element type of the `items` array.
 * @typeParam T Tag name rendered for the container.
 */
export type MasonProps<Data, T extends MasonTag = 'div'> = OmitAndMerge<
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
  ComponentProps<T>
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
 * Layout re-runs when `columns` changes, when the window resizes, and whenever
 * children are added, removed or reordered, always batched onto the next
 * animation frame.
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
export function Mason<Data, T extends MasonTag = 'div'>(props: MasonProps<Data, T>): JSX.Element {
  const [ref, setRef] = createSignal<HTMLElement>();

  createEffect(
    // The compute phase is the tracked one, so everything the setup depends on
    // is read here. A new column count rebuilds the state and starts over.
    () => ({ el: ref(), columns: props.columns }),
    ({ el, columns }) => {
      if (!el) {
        return undefined;
      }

      const state: MasonState = createMasonState(columns);

      let frame: number | undefined;

      // A pass reads layout for every child, so bursts of mutations and resize
      // events collapse into one run on the next frame.
      const recalculate = (): void => {
        if (frame !== undefined) {
          cancelAnimationFrame(frame);
        }
        frame = requestAnimationFrame(() => {
          frame = undefined;
          createMason(el, state);
        });
      };

      window.addEventListener('resize', recalculate, { passive: true });

      // `items` is not watched directly. Every change to it reaches the DOM as
      // children being added, removed or moved, which this sees; a change that
      // moves no child leaves nothing to re-measure.
      const observer = new MutationObserver((mutations) => {
        if (mutations.length) {
          recalculate();
        }
      });

      observer.observe(el, { childList: true });

      recalculate();

      return () => {
        window.removeEventListener('resize', recalculate);
        observer.disconnect();
        if (frame !== undefined) {
          cancelAnimationFrame(frame);
        }
      };
    },
  );

  function setContainer(el: HTMLElement): void {
    setRef(el);
    // A caller's `ref` is pulled out of the forwarded props and called here, so
    // that taking one does not replace the reference the layout pass needs.
    const forwarded = props.ref;
    if (typeof forwarded === 'function') {
      forwarded(el);
    }
  }

  // One factory per instance, as `dynamic()` wants. It tracks `as`, so
  // changing the tag re-renders the container.
  const Container = dynamic(() => props.as ?? 'div');

  // Built as one object and cast once. `T` is still open here, so the checker
  // cannot line the forwarded props up with the element `as` names on its own.
  const containerProps = merge(
    {
      ref: setContainer,
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
    omit(props, 'as', 'children', 'columns', 'items', 'ref', 'style'),
  ) as unknown as ComponentProps<T>;

  return (
    <Container {...containerProps}>
      <For each={props.items}>
        {(item, index) => <div style={{ position: 'absolute' }}>{props.children(item, index)}</div>}
      </For>
    </Container>
  );
}
