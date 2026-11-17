import type { JSX } from '@solidjs/web';
import { createSignal } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { MASON_KEY, Mason } from '../src/index';
import { getChildren, getContainer, nextFrames, renderInHost } from './utils';

interface Box {
  id: number;
  height: number;
}

function boxes(heights: number[]): Box[] {
  return heights.map((height, id) => ({ id, height }));
}

function Item(props: { item: Box }): JSX.Element {
  return <div style={{ height: `${props.item.height}px` }}>{props.item.id}</div>;
}

const HOST_WIDTH = 400;

describe('Mason', () => {
  it('renders one child per item', async () => {
    const host = renderInHost(() => (
      <Mason columns={2} items={boxes([100, 100, 100])}>
        {(item) => <Item item={item} />}
      </Mason>
    ));
    await nextFrames();

    expect(getChildren(getContainer(host))).toHaveLength(3);
  });

  it('renders a div by default and honours `as`', async () => {
    const host = renderInHost(() => (
      <Mason as="section" columns={2} items={boxes([50])}>
        {(item) => <Item item={item} />}
      </Mason>
    ));
    await nextFrames();

    expect(getContainer(host).tagName).toBe('SECTION');
  });

  it('divides the container width across the columns', async () => {
    const host = renderInHost(
      () => (
        <Mason columns={4} items={boxes([100, 100, 100, 100])}>
          {(item) => <Item item={item} />}
        </Mason>
      ),
      HOST_WIDTH,
    );
    await nextFrames();

    for (const child of getChildren(getContainer(host))) {
      expect(child.style.width).toBe(`${HOST_WIDTH / 4}px`);
    }
  });

  it('places the first row of items side by side at the top', async () => {
    const host = renderInHost(
      () => (
        <Mason columns={2} items={boxes([100, 100])}>
          {(item) => <Item item={item} />}
        </Mason>
      ),
      HOST_WIDTH,
    );
    await nextFrames();

    const [first, second] = getChildren(getContainer(host));
    expect(first.style.top).toBe('0px');
    expect(second.style.top).toBe('0px');
    expect(first.style.left).toBe('0px');
    expect(second.style.left).toBe(`${HOST_WIDTH / 2}px`);
  });

  it('stacks the next item under the shortest column', async () => {
    const host = renderInHost(
      () => (
        <Mason columns={2} items={boxes([100, 40, 30])}>
          {(item) => <Item item={item} />}
        </Mason>
      ),
      HOST_WIDTH,
    );
    await nextFrames();

    const [, second, third] = getChildren(getContainer(host));
    // Column 1 is 40px tall against column 0's 100px, so the third item lands
    // beneath the second rather than beneath the first.
    expect(third.style.left).toBe(second.style.left);
    expect(third.style.top).toBe('40px');
  });

  it('sizes the container to its tallest column', async () => {
    const host = renderInHost(
      () => (
        <Mason columns={2} items={boxes([100, 40, 30])}>
          {(item) => <Item item={item} />}
        </Mason>
      ),
      HOST_WIDTH,
    );
    await nextFrames();

    expect(getContainer(host).style.height).toBe('100px');
  });

  it('lays out items appended after the first pass', async () => {
    const [items, setItems] = createSignal(boxes([100, 100]));
    const host = renderInHost(
      () => (
        <Mason columns={2} items={items()}>
          {(item) => <Item item={item} />}
        </Mason>
      ),
      HOST_WIDTH,
    );
    await nextFrames();

    setItems(boxes([100, 100, 60, 60]));
    await nextFrames();

    const container = getContainer(host);
    expect(getChildren(container)).toHaveLength(4);
    expect(container.style.height).toBe('160px');
  });

  it('re-lays out when the column count changes', async () => {
    const [columns, setColumns] = createSignal(2);
    const host = renderInHost(
      () => (
        <Mason columns={columns()} items={boxes([100, 100])}>
          {(item) => <Item item={item} />}
        </Mason>
      ),
      HOST_WIDTH,
    );
    await nextFrames();

    setColumns(1);
    await nextFrames();

    const container = getContainer(host);
    expect(container.getAttribute(MASON_KEY)).toBe('1');
    expect(getChildren(container)[0].style.width).toBe(`${HOST_WIDTH}px`);
    expect(container.style.height).toBe('200px');
  });

  it('keeps the container positioned for absolute children', async () => {
    const host = renderInHost(() => (
      <Mason columns={2} items={boxes([50])}>
        {(item) => <Item item={item} />}
      </Mason>
    ));
    await nextFrames();

    expect(getComputedStyle(getContainer(host)).position).toBe('relative');
  });

  it('merges an object `style` with the styles it needs', async () => {
    const host = renderInHost(() => (
      <Mason columns={2} items={boxes([50])} style={{ 'background-color': 'rgb(255, 0, 0)' }}>
        {(item) => <Item item={item} />}
      </Mason>
    ));
    await nextFrames();

    const styles = getComputedStyle(getContainer(host));
    expect(styles.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(styles.position).toBe('relative');
  });

  it('merges a string `style` with the styles it needs', async () => {
    const host = renderInHost(() => (
      <Mason columns={2} items={boxes([50])} style="background-color: rgb(0, 0, 255)">
        {(item) => <Item item={item} />}
      </Mason>
    ));
    await nextFrames();

    const styles = getComputedStyle(getContainer(host));
    expect(styles.backgroundColor).toBe('rgb(0, 0, 255)');
    expect(styles.position).toBe('relative');
  });

  it('forwards unknown props to the container element', async () => {
    const host = renderInHost(() => (
      <Mason class="grid" columns={2} id="gallery" items={boxes([50])}>
        {(item) => <Item item={item} />}
      </Mason>
    ));
    await nextFrames();

    const container = getContainer(host);
    expect(container.id).toBe('gallery');
    expect(container.className).toBe('grid');
  });

  it('hands the container to a caller ref without losing its own', async () => {
    let container: HTMLElement | undefined;
    const host = renderInHost(
      () => (
        <Mason
          columns={2}
          items={boxes([100, 100])}
          ref={(el) => {
            container = el;
          }}
        >
          {(item) => <Item item={item} />}
        </Mason>
      ),
      HOST_WIDTH,
    );
    await nextFrames();

    expect(container).toBe(getContainer(host));
    // The layout pass still ran, so Mason kept its own reference too.
    expect(container?.style.height).toBe('100px');
  });

  it('renders nothing for a null item list', async () => {
    const host = renderInHost(() => (
      <Mason columns={2} items={null}>
        {(item: Box) => <Item item={item} />}
      </Mason>
    ));
    await nextFrames();

    expect(getChildren(getContainer(host))).toHaveLength(0);
  });
});
