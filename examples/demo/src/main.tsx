import {
  createSignal, JSX, onCleanup, onMount,
} from 'solid-js';
import { render } from 'solid-js/web';
import { Mason, createMasonryBreakpoints } from 'solid-mason';
import './style.css';

const HORIZONTAL_ASPECT_RATIO = [
  { width: 4, height: 4 }, // Square
  { width: 4, height: 3 }, // Standard Fullscreen
  { width: 16, height: 10 }, // Standard LCD
  { width: 16, height: 9 }, // HD
  // { width: 37, height: 20 }, // Widescreen
  { width: 6, height: 3 }, // Univisium
  { width: 21, height: 9 }, // Anamorphic 2.35:1
  // { width: 64, height: 27 }, // Anamorphic 2.39:1 or 2.37:1
  { width: 19, height: 16 }, // Movietone
  { width: 5, height: 4 }, // 17' LCD CRT
  // { width: 48, height: 35 }, // 16mm and 35mm
  { width: 11, height: 8 }, // 35mm full sound
  // { width: 143, height: 100 }, // IMAX
  { width: 6, height: 4 }, // 35mm photo
  { width: 14, height: 9 }, // commercials
  { width: 5, height: 3 }, // Paramount
  { width: 7, height: 4 }, // early 35mm
  { width: 11, height: 5 }, // 70mm
  { width: 12, height: 5 }, // Bluray
  { width: 8, height: 3 }, // Super 16
  { width: 18, height: 5 }, // IMAX
  { width: 12, height: 3 }, // Polyvision
];

const VERTICAL_ASPECT_RATIO = HORIZONTAL_ASPECT_RATIO.map((item) => ({
  width: item.height,
  height: item.width,
}));

const ASPECT_RATIO = [
  ...HORIZONTAL_ASPECT_RATIO,
  ...VERTICAL_ASPECT_RATIO,
].map((item) => ({
  width: item.width * 50,
  height: item.height * 50,
}));

interface Item {
  id: number;
  width: number;
  height: number;
}

function createNewImage(id: number): Item {
  const randomAspectRatio = ASPECT_RATIO[Math.floor(Math.random() * ASPECT_RATIO.length)];

  return {
    ...randomAspectRatio,
    id,
  };
}

function Root(): JSX.Element {
  const [items, setItems] = createSignal<Item[]>([]);

  function addItems() {
    setItems((current) => {
      const newData = [...current];

      for (let i = 0; i < 20; i += 1) {
        newData.push(createNewImage(newData.length + 1));
      }

      return newData;
    });
  }

  function onScroll() {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      addItems();
    }
  }

  onMount(() => {
    addItems();

    document.addEventListener('scroll', onScroll, {
      passive: true,
    });

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

  return (
    <div class="w-screen p-8 min-h-screen">
      <Mason columns={breakpoints()} items={items()}>
        {(item) => (
          <div class="w-full p-2">
            <div class="parent rounded-xl overflow-hidden" style={{ 'aspect-ratio': `${item.width}/${item.height}` }}>
              <div
                class="child flex items-center justify-center"
                style={{
                  'background-image': `url(https://picsum.photos/id/${item.id}/${item.width}/${item.height}/)`,
                }}
              >
                <span class="font-semibold text-lg text-white">{`Image no. ${item.id}`}</span>
              </div>
            </div>
          </div>
        )}
      </Mason>
    </div>
  );
}

const app = document.getElementById('app');

if (app) {
  render(() => <Root />, app);
}
