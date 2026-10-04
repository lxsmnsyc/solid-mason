import type { Accessor } from 'solid-js';
import { createEffect, createSignal } from 'solid-js';

/** Smallest vertical gap between two labels in the gutter, in pixels. */
const LABEL_GAP = 14;

/** Half a line of text, so the topmost label is not clipped by the overlay. */
const LABEL_INSET = 7;

/** One item's leader line and label. */
export interface OrderMarker {
  /** Position of the item in the child list, counting from zero. */
  index: number;
  /** Left edge of the item, where the leader line starts. */
  x: number;
  /** Top edge of the item, where the leader line starts. */
  y: number;
  /** Vertical position of the label, nudged down to clear its neighbours. */
  labelY: number;
}

/** Everything the overlay needs for one layout pass. */
export interface OrderOverlay {
  /** Width of the measured area, including the gutter. */
  width: number;
  /** Height of the measured area. */
  height: number;
  /** One marker per item, in document order. */
  markers: OrderMarker[];
}

const EMPTY: OrderOverlay = { width: 0, height: 0, markers: [] };

/**
 * Items whose tops are within a few pixels of each other would print their
 * labels on top of one another, so labels are pushed down the gutter until they
 * clear. The leader line absorbs the difference, which is why it bends.
 */
function declutter(markers: OrderMarker[]): void {
  const byHeight = [...markers].sort((a, b) => a.y - b.y || a.index - b.index);

  let previous = Number.NEGATIVE_INFINITY;
  for (const marker of byHeight) {
    marker.labelY = Math.max(marker.y, previous + LABEL_GAP, LABEL_INSET);
    previous = marker.labelY;
  }
}

/**
 * Measures where Mason placed each child, so the overlay can draw a line from
 * the top-left corner of every item out to a gutter and print the child index
 * there.
 *
 * The point is to make the placement rule visible: Mason drops each item into
 * whichever column is shortest when it reaches that item, so the indices run
 * down the page in an order that has little to do with the columns.
 *
 * Mason positions children by writing inline styles on them, so watching the
 * child list and those style attributes catches every pass it runs, including
 * the ones triggered by a resize or a breakpoint change. Measurements are
 * batched onto a frame because a single pass touches every child.
 *
 * @param wrapper Accessor for the element holding both the grid and the gutter.
 * @param container Accessor for the element Mason rendered.
 * @returns Accessor for the overlay geometry.
 */
export function createOrderMarkers(
  wrapper: Accessor<HTMLElement | undefined>,
  container: Accessor<HTMLElement | undefined>,
): Accessor<OrderOverlay> {
  const [overlay, setOverlay] = createSignal<OrderOverlay>(EMPTY);

  createEffect(
    // The compute phase is the tracked one, so both elements are read here.
    () => ({ host: wrapper(), el: container() }),
    ({ host, el }) => {
      if (!host || !el) {
        return undefined;
      }

      let frame: number | undefined;

      const measure = (): void => {
        frame = undefined;

        const markers = Array.from(el.children)
          .filter((child): child is HTMLElement => child instanceof HTMLElement)
          .map((child, index) => ({
            index,
            x: child.offsetLeft,
            y: child.offsetTop,
            labelY: 0,
          }));

        declutter(markers);

        setOverlay({
          width: host.clientWidth,
          height: host.clientHeight,
          markers,
        });
      };

      const schedule = (): void => {
        if (frame !== undefined) {
          cancelAnimationFrame(frame);
        }
        frame = requestAnimationFrame(measure);
      };

      const observer = new MutationObserver(schedule);
      observer.observe(el, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style'],
      });

      window.addEventListener('resize', schedule, { passive: true });

      schedule();

      return () => {
        observer.disconnect();
        window.removeEventListener('resize', schedule);
        if (frame !== undefined) {
          cancelAnimationFrame(frame);
        }
      };
    },
  );

  return overlay;
}
