import { createRoot, createSignal, flush } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MasonryBreakpoint } from '../src/index';
import { createMasonryBreakpoints } from '../src/index';

/**
 * `matchMedia` is driven by the real viewport, which a test cannot resize, so
 * the suite installs a stub whose `matches` it can flip and whose `change`
 * listeners it can fire by hand.
 */
class FakeMediaQueryList extends EventTarget {
  matches = false;

  constructor(readonly media: string) {
    super();
  }

  set(matches: boolean): void {
    this.matches = matches;
    this.dispatchEvent(new Event('change'));
    // Solid 2 batches on a microtask. The listener's write has to land before
    // the test reads the accessor back.
    flush();
  }
}

const originalMatchMedia = window.matchMedia;
const lists = new Map<string, FakeMediaQueryList>();

function stubMatchMedia(): void {
  lists.clear();
  vi.stubGlobal('matchMedia', (media: string) => {
    let existing = lists.get(media);
    if (!existing) {
      existing = new FakeMediaQueryList(media);
      lists.set(media, existing);
    }
    return existing;
  });
}

function list(media: string): FakeMediaQueryList {
  const found = lists.get(media);
  if (!found) {
    throw new Error(`matchMedia was never called with ${media}`);
  }
  return found;
}

afterEach(() => {
  vi.stubGlobal('matchMedia', originalMatchMedia);
  lists.clear();
});

// The module caches one `MediaQueryList` per query string for the lifetime of
// the page, so every test uses query text no other test uses.
let uniqueId = 0;
function uniqueQuery(): string {
  uniqueId += 1;
  return `(min-width: ${uniqueId}px)`;
}

/**
 * Effects are queued rather than run inline, so the root is flushed before the
 * accessor is read. Reading inside the `createRoot` callback would see the
 * default instead of the matching breakpoint.
 */
function mount(
  breakpoints: () => MasonryBreakpoint[],
  defaultColumns?: number,
): { columns: () => number; dispose: () => void } {
  const mounted = createRoot((dispose) => ({
    columns: createMasonryBreakpoints(breakpoints, defaultColumns),
    dispose,
  }));
  flush();
  return mounted;
}

describe('createMasonryBreakpoints', () => {
  it('falls back to one column when nothing matches', () => {
    stubMatchMedia();

    const { columns, dispose } = mount(() => [{ query: uniqueQuery(), columns: 4 }]);
    expect(columns()).toBe(1);
    dispose();
  });

  it('uses the supplied default when nothing matches', () => {
    stubMatchMedia();

    const { columns, dispose } = mount(() => [{ query: uniqueQuery(), columns: 4 }], 3);
    expect(columns()).toBe(3);
    dispose();
  });

  it('reports the column count of a query that already matches', () => {
    stubMatchMedia();
    const query = uniqueQuery();
    // Prime the cache so the query matches before the effect first reads it.
    window.matchMedia(query);
    list(query).matches = true;

    const { columns, dispose } = mount(() => [{ query, columns: 5 }]);
    expect(columns()).toBe(5);
    dispose();
  });

  it('updates when a query starts matching', () => {
    stubMatchMedia();
    const query = uniqueQuery();

    const { columns, dispose } = mount(() => [{ query, columns: 6 }]);
    expect(columns()).toBe(1);

    list(query).set(true);
    expect(columns()).toBe(6);

    dispose();
  });

  it('lets a later breakpoint win when two match at once', () => {
    stubMatchMedia();
    const wide = uniqueQuery();
    const narrow = uniqueQuery();

    const { columns, dispose } = mount(() => [
      { query: wide, columns: 6 },
      { query: narrow, columns: 2 },
    ]);

    list(wide).set(true);
    list(narrow).set(true);
    expect(columns()).toBe(2);

    dispose();
  });

  it('re-subscribes when the breakpoint list changes', () => {
    stubMatchMedia();
    const first = uniqueQuery();
    const second = uniqueQuery();
    const [breakpoints, setBreakpoints] = createSignal<MasonryBreakpoint[]>([
      { query: first, columns: 4 },
    ]);

    const { columns, dispose } = mount(breakpoints);

    list(first).set(true);
    expect(columns()).toBe(4);

    setBreakpoints([{ query: second, columns: 8 }]);
    flush();
    list(second).set(true);
    expect(columns()).toBe(8);

    // The old query no longer has a listener, so it cannot move the count.
    list(first).set(true);
    expect(columns()).toBe(8);

    dispose();
  });

  it('stops listening once the owning scope is disposed', () => {
    stubMatchMedia();
    const query = uniqueQuery();

    const { columns, dispose } = mount(() => [{ query, columns: 7 }]);
    dispose();
    flush();

    list(query).set(true);
    expect(columns()).toBe(1);
  });
});
