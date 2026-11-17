/**
 * The layout pass. Everything here is plain DOM work with no reactivity, so
 * that the reactive wrapper in `mason.ts` only has to decide *when* to run it.
 */

/**
 * Marker attribute written on the container element, carrying the column count
 * the container was last laid out with. It exists so that a page (or a test)
 * can find a masonry container and read its column count without reaching into
 * the component.
 */
export const MASON_KEY = 'data-solid-mason' as const;

/**
 * Styles the container needs for absolute positioning of its children to mean
 * anything. Applied as an object when the caller passes an object `style`.
 */
export const MASON_STYLE = {
  position: 'relative',
  width: '100%',
  'max-width': '100%',
} as const;

/**
 * The same declarations as {@link MASON_STYLE}, in the form appended to a
 * caller-supplied `style` string. The leading semicolon guards against a
 * caller string that does not end in one.
 */
export const MASON_STYLE_STRING = ';position:relative;width:100%;max-width:100%;';

/**
 * Index of the column with the smallest running height. New children are
 * placed here, which is what gives the layout its ragged bottom edge.
 *
 * @param columns Running height of each column, in pixels.
 * @returns Index into `columns`. `0` when `columns` is empty.
 */
export function getShortestColumn(columns: number[]): number {
  let result = 0;
  let record = Number.MAX_SAFE_INTEGER;

  for (let i = 0, len = columns.length; i < len; i += 1) {
    if (columns[i] < record) {
      record = columns[i];
      result = i;
    }
  }

  return result;
}

/**
 * Index of the tallest column. The container is sized to this column so that
 * absolutely positioned children still occupy space in the document flow.
 *
 * @param columns Running height of each column, in pixels.
 * @returns Index into `columns`. `0` when `columns` is empty.
 */
export function getLongestColumn(columns: number[]): number {
  let result = 0;
  let record = 0;

  for (let i = 0, len = columns.length; i < len; i += 1) {
    if (columns[i] > record) {
      record = columns[i];
      result = i;
    }
  }

  return result;
}

/**
 * Width available to children: the element's client width with its horizontal
 * padding removed. Borders and scrollbars are already excluded by
 * `clientWidth`.
 *
 * @param el Container element.
 * @returns Content width in pixels.
 */
export function getContentWidth(el: HTMLElement): number {
  const styles = getComputedStyle(el);

  return (
    el.clientWidth - Number.parseFloat(styles.paddingLeft) - Number.parseFloat(styles.paddingRight)
  );
}

/**
 * Layout state carried across passes so that an unchanged child can keep its
 * measured height instead of being measured again.
 */
export interface MasonState {
  /** Content width the last pass was computed against. */
  width: number;
  /** Running height of each column after the last pass. */
  columns: number[];
  /** Children in document order as of the last pass. */
  elements: HTMLElement[];
  /** Measured height of each entry in {@link MasonState.elements}. */
  heights: number[];
}

/**
 * Creates the state a container starts from.
 *
 * @param columns Number of columns. Values below `1` are clamped to `1`.
 */
export function createMasonState(columns: number): MasonState {
  return {
    width: 0,
    columns: Array.from<number>({ length: Math.max(1, Math.floor(columns)) }).fill(0),
    elements: [],
    heights: [],
  };
}

/**
 * Runs one layout pass over `el`'s element children.
 *
 * Each child is absolutely positioned into the shortest column at the time it
 * is visited, and the container is given the height of the tallest column. A
 * child is only re-measured when the container width changed or when the child
 * itself is new at that position, which keeps an append-only feed (the common
 * case for a masonry grid) from re-measuring everything already on screen.
 *
 * This reads and writes layout, so callers should batch it behind an animation
 * frame rather than calling it per mutation.
 *
 * @param el Container element.
 * @param state Mutable state from the previous pass, updated in place.
 */
export function createMason(el: HTMLElement, state: MasonState): void {
  const columnCount = state.columns.length;
  const containerWidth = getContentWidth(el);
  // A width change invalidates every measurement, since children are sized to
  // a fraction of the container.
  let isAllDirty = containerWidth !== state.width;
  const widthPerColumn = containerWidth / columnCount;

  const newColumns = Array.from<number>({ length: columnCount }).fill(0);

  let node = el.firstElementChild;
  let nodeIndex = 0;

  while (node) {
    if (node instanceof HTMLElement) {
      const targetColumn = getShortestColumn(newColumns);
      if (isAllDirty || state.elements[nodeIndex] !== node) {
        node.style.width = `${widthPerColumn}px`;
        node.style.position = 'absolute';
        const currentColumnHeight = newColumns[targetColumn];
        node.style.top = `${currentColumnHeight}px`;
        node.style.left = `${targetColumn * widthPerColumn}px`;
        // Force a reflow so that `offsetHeight` reflects the width just set
        // rather than the width the child had before this pass.
        node.getBoundingClientRect();
        const nodeHeight = node.offsetHeight;
        state.elements[nodeIndex] = node;
        state.heights[nodeIndex] = nodeHeight;
        // Once one child moves, every child after it has to move too.
        isAllDirty = true;
        newColumns[targetColumn] = currentColumnHeight + nodeHeight;
      } else {
        newColumns[targetColumn] += state.heights[nodeIndex];
      }
      nodeIndex += 1;
    }
    node = node.nextElementSibling;
  }

  // Drop measurements for children that no longer exist, so a shrinking list
  // cannot match a stale element on a later pass.
  state.elements.length = nodeIndex;
  state.heights.length = nodeIndex;

  el.style.height = `${newColumns[getLongestColumn(newColumns)]}px`;
  state.width = containerWidth;
  state.columns = newColumns;
}
