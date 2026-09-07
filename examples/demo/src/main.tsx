import type { JSX } from 'solid-js';
import { For, createSignal, onCleanup, onMount } from 'solid-js';
import { render } from 'solid-js/web';
import { Mason, createMasonryBreakpoints } from 'solid-mason';
import { createOrderMarkers } from './order-markers';
import './style.css';

const HORIZONTAL_ASPECT_RATIO = [
  { width: 4, height: 4 }, // Square
  { width: 4, height: 3 }, // Standard fullscreen
  { width: 16, height: 10 }, // Standard LCD
  { width: 16, height: 9 }, // HD
  { width: 6, height: 3 }, // Univisium
  { width: 21, height: 9 }, // Anamorphic 2.35:1
  { width: 19, height: 16 }, // Movietone
  { width: 5, height: 4 }, // 17" LCD CRT
  { width: 11, height: 8 }, // 35mm full sound
  { width: 6, height: 4 }, // 35mm photo
  { width: 14, height: 9 }, // Commercials
  { width: 5, height: 3 }, // Paramount
  { width: 7, height: 4 }, // Early 35mm
  { width: 11, height: 5 }, // 70mm
  { width: 12, height: 5 }, // Blu-ray
  { width: 8, height: 3 }, // Super 16
  { width: 18, height: 5 }, // IMAX
  { width: 12, height: 3 }, // Polyvision
];

const VERTICAL_ASPECT_RATIO = HORIZONTAL_ASPECT_RATIO.map((item) => ({
  width: item.height,
  height: item.width,
}));

const ASPECT_RATIO = [...HORIZONTAL_ASPECT_RATIO, ...VERTICAL_ASPECT_RATIO].map((item) => ({
  width: item.width * 50,
  height: item.height * 50,
}));

const BATCH_SIZE = 20;

/** Width of the label gutter, matching the `pr-14` on the grid wrapper. */
const GUTTER = 56;

/** Room reserved for the label text at the end of each leader line. */
const LABEL_WIDTH = 20;

/** Height of a marker's hover target in the gutter. */
const HIT_HEIGHT = 13;

interface Item {
  id: number;
  width: number;
  height: number;
}

function createNewImage(id: number): Item {
  const randomAspectRatio = ASPECT_RATIO[Math.floor(Math.random() * ASPECT_RATIO.length)];

  return { ...randomAspectRatio, id };
}

function Root(): JSX.Element {
  const [items, setItems] = createSignal<Item[]>([]);

  function addItems(): void {
    setItems((current) => {
      const newData = [...current];

      for (let i = 0; i < BATCH_SIZE; i += 1) {
        newData.push(createNewImage(newData.length + 1));
      }

      return newData;
    });
  }

  function onScroll(): void {
    // Load the next batch a screen ahead of the bottom, so the list keeps up
    // with a fast scroll instead of stalling at the end of the page.
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - window.innerHeight) {
      addItems();
    }
  }

  onMount(() => {
    addItems();

    document.addEventListener('scroll', onScroll, { passive: true });

    onCleanup(() => {
      document.removeEventListener('scroll', onScroll);
    });
  });

  const breakpoints = createMasonryBreakpoints(() => [
    { query: '(min-width: 1536px)', columns: 6 },
    { query: '(min-width: 1280px) and (max-width: 1536px)', columns: 5 },
    { query: '(min-width: 1024px) and (max-width: 1280px)', columns: 4 },
    { query: '(min-width: 768px) and (max-width: 1024px)', columns: 3 },
    { query: '(max-width: 768px)', columns: 2 },
  ]);

  const [wrapper, setWrapper] = createSignal<HTMLElement>();
  const [container, setContainer] = createSignal<HTMLElement>();
  const overlay = createOrderMarkers(wrapper, container);

  // Index of the marker under the pointer, if any. Hovering one lifts its item
  // out of the grid and fades the rest, which is the quickest way to see where
  // a given position in the child list actually ended up.
  const [active, setActive] = createSignal<number>();

  return (
    <div class="min-h-screen w-screen p-8">
      {/* The padding on the right is the gutter the index labels sit in, kept
          clear of the grid so every label lines up in one column. */}
      <div
        class="relative pr-14"
        classList={{ 'is-tracing': active() !== undefined }}
        ref={(el) => {
          setWrapper(el);
        }}
      >
        <Mason
          columns={breakpoints()}
          items={items()}
          ref={(el) => {
            setContainer(el);
          }}
        >
          {(item, index) => (
            <div class="w-full p-2">
              <div
                class="parent relative overflow-hidden rounded-xl"
                classList={{ 'is-active': active() === index() }}
                style={{ 'aspect-ratio': `${item.width}/${item.height}` }}
              >
                <div
                  class="child"
                  style={{
                    'background-image': `url(https://picsum.photos/seed/${item.id}/${item.width}/${item.height})`,
                  }}
                />
                {/* The label sits outside `.child` so the hover zoom does not
                    drag it out of position or soften it. */}
                <span class="image-label">{`Image no. ${item.id}`}</span>
              </div>
            </div>
          )}
        </Mason>
        <svg class="order-layer" width={overlay().width} height={overlay().height}>
          <For each={overlay().markers}>
            {(marker) => {
              const bend = overlay().width - GUTTER;
              return (
                <g class="order-marker" classList={{ 'is-active': active() === marker.index }}>
                  <circle class="order-dot" cx={marker.x} cy={marker.y} r="2.5" />
                  <polyline
                    class="order-line"
                    points={`${marker.x},${marker.y} ${bend - 10},${marker.y} ${bend},${marker.labelY} ${overlay().width - LABEL_WIDTH},${marker.labelY}`}
                  />
                  <text
                    class="order-index"
                    x={overlay().width}
                    y={marker.labelY}
                    text-anchor="end"
                    dominant-baseline="middle"
                  >
                    {marker.index}
                  </text>
                  {/* The overlay itself ignores the pointer, so each marker
                      carries its own hit area over the gutter. It is taller
                      than the digits to stay reachable once labels are packed
                      against each other. */}
                  <rect
                    class="order-hit"
                    x={bend}
                    y={marker.labelY - HIT_HEIGHT / 2}
                    width={GUTTER}
                    height={HIT_HEIGHT}
                    onMouseEnter={() => {
                      setActive(marker.index);
                    }}
                    onMouseLeave={() => {
                      setActive(undefined);
                    }}
                  />
                </g>
              );
            }}
          </For>
        </svg>
      </div>
    </div>
  );
}

const app = document.getElementById('app');

if (app) {
  render(() => <Root />, app);
}
