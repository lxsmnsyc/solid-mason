import type { JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach } from 'vitest';

const disposers: (() => void)[] = [];

afterEach(() => {
  while (disposers.length) {
    disposers.pop()?.();
  }
  document.body.innerHTML = '';
});

/**
 * Renders into a fixed-width host attached to the document, so that the layout
 * pass has a real container width to divide up. Disposed after each test.
 */
export function renderInHost(code: () => JSX.Element, width = 400): HTMLDivElement {
  const host = document.createElement('div');
  host.style.width = `${width}px`;
  document.body.append(host);
  disposers.push(render(code, host));
  return host;
}

/** Resolves after `count` animation frames, once layout has been applied. */
export async function nextFrames(count = 2): Promise<void> {
  return new Promise<void>((resolve) => {
    let remaining = count;
    const step = (): void => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  });
}

/** The container `Mason` rendered, found by its marker attribute. */
export function getContainer(host: HTMLElement): HTMLElement {
  const el = host.querySelector<HTMLElement>('[data-solid-mason]');
  if (!el) {
    throw new Error('Mason container was not rendered');
  }
  return el;
}

/** Direct element children of the container, in document order. */
export function getChildren(container: HTMLElement): HTMLElement[] {
  return [...container.children] as HTMLElement[];
}
