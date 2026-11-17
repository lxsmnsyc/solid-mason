import { createEffect, createSignal } from 'solid-js';

// `matchMedia` allocates a new `MediaQueryList` per call, and each one carries
// its own listener set. Sharing one per query string keeps a page full of
// masonry containers from holding a separate list for the same breakpoint.
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

/**
 * A media query paired with the column count to use while it matches.
 */
export interface MasonryBreakpoint {
  /** Media query text, as accepted by `window.matchMedia`. */
  query: string;
  /** Column count to apply while {@link MasonryBreakpoint.query} matches. */
  columns: number;
}

/**
 * Tracks a list of media queries and reports the column count of the matching
 * one.
 *
 * Breakpoints are evaluated in order, so when two queries match at the same
 * time the later one wins. Write them from widest to narrowest, or make them
 * mutually exclusive, to keep that from surprising you.
 *
 * The accessor is meant to be handed straight to `Mason`'s `columns` prop:
 *
 * ```tsx
 * const breakpoints = createMasonryBreakpoints(() => [
 *   { query: '(min-width: 1280px)', columns: 5 },
 *   { query: '(min-width: 768px) and (max-width: 1280px)', columns: 3 },
 *   { query: '(max-width: 768px)', columns: 2 },
 * ]);
 *
 * <Mason columns={breakpoints()} items={items()}>
 *   {item => <Card item={item} />}
 * </Mason>;
 * ```
 *
 * This reads `window`, so it only runs on the client. Under SSR the accessor
 * stays at `defaultColumns` until hydration.
 *
 * @param breakpoints Accessor for the breakpoint list. Re-reading it re-subscribes.
 * @param defaultColumns Column count before any query matches. Defaults to `1`.
 * @returns Accessor for the current column count.
 */
export function createMasonryBreakpoints(
  breakpoints: () => MasonryBreakpoint[],
  defaultColumns = 1,
): () => number {
  const [columns, setColumns] = createSignal(defaultColumns);

  createEffect(breakpoints, (list) => {
    const listeners = list.map((item) => {
      const media = getMediaMatcher(item.query);
      const callback = (): void => {
        if (media.matches) {
          setColumns(item.columns);
        }
      };
      callback();
      media.addEventListener('change', callback, false);
      return { media, callback };
    });

    return () => {
      for (const { media, callback } of listeners) {
        media.removeEventListener('change', callback, false);
      }
    };
  });

  return columns;
}
