// Vice Cover Studio wiring: layout and panel state, photo loading, the caption
// controls, click-to-select panels, and PNG export. A `?shot=` query hands the
// page to ./shots.js for a fixed screenshot scene instead.

import { drawScene, panelAt, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

// One pool of four panel slots; the active layout decides how many show.
const panelPool = Array.from({ length: 4 }, () => ({ img: null, zoom: 1, panX: 0, panY: 0 }));
const state = {
  layout: 'skyline',
  caption: 'Neon Coast',
  subtitle: 'Sunset heist · 2026',
  titleScale: 1,
  titleColor: '#ffffff',
  grade: 'sunset',
  exportSize: '1080x1080',
};
let selected = 0;
let cleanPreview = false; // shot=cover: draw the poster with no editor outline

function panels() {
  return panelPool.slice(0, LAYOUTS[state.layout].panels.length);
}

function snapshot() {
  return {
    layout: state.layout,
    panels: panels(),
    caption: state.caption,
    subtitle: state.subtitle,
    titleScale: state.titleScale,
    titleColor: state.titleColor,
    grade: state.grade,
  };
}

function redraw() {
  drawScene(ctx, canvas.width, canvas.height, snapshot(), { highlight: cleanPreview ? -1 : selected });
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function selectPanel(i) {
  selected = Math.max(0, Math.min(panels().length - 1, i));
  document.getElementById('panelName').textContent = `Panel ${selected + 1}`;
  const p = panelPool[selected];
  document.getElementById('zoom').value = p.zoom;
  document.getElementById('zoomVal').textContent = `${p.zoom.toFixed(2)}×`;
  document.getElementById('panX').value = p.panX;
  document.getElementById('panY').value = p.panY;
  redraw();
}

function setLayout(name) {
  if (!LAYOUTS[name]) return;
  state.layout = name;
  document.querySelectorAll('.layout-btn').forEach((b) => {
    const on = b.dataset.layout === name;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  selectPanel(Math.min(selected, panels().length - 1));
}

function setSize(size) {
  const [w, h] = size.split('x').map(Number);
  if (!w || !h) return;
  state.exportSize = size;
  canvas.width = w;
  canvas.height = h;
  const select = document.getElementById('exportSize');
  if ([...select.options].some((o) => o.value === size)) select.value = size;
  redraw();
}

async function loadIntoSelected(url) {
  try {
    panelPool[selected].img = await loadImage(url);
    status.textContent = `Photo loaded into Panel ${selected + 1}.`;
  } catch {
    status.textContent = 'That photo could not be read.';
  }
  redraw();
}

document.getElementById('layouts').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-layout]');
  if (btn) setLayout(btn.dataset.layout);
});

document.getElementById('photoFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await loadIntoSelected(URL.createObjectURL(file));
  e.target.value = '';
});

document.getElementById('fillAll').addEventListener('click', () => {
  const source = panelPool[selected];
  if (!source.img) {
    status.textContent = 'Load a photo into this panel first.';
    return;
  }
  panels().forEach((p) => {
    p.img = source.img;
    p.zoom = 1;
    p.panX = 0;
    p.panY = 0;
  });
  status.textContent = 'Same photo in every panel.';
  redraw();
});

document.getElementById('clearPanel').addEventListener('click', () => {
  panelPool[selected] = { img: null, zoom: 1, panX: 0, panY: 0 };
  status.textContent = `Panel ${selected + 1} cleared.`;
  selectPanel(selected);
});

document.getElementById('samplePier').addEventListener('click', () => loadIntoSelected('samples/pier.jpg'));
document.getElementById('sampleBoulevard').addEventListener('click', () => loadIntoSelected('samples/boulevard.jpg'));

document.getElementById('zoom').addEventListener('input', (e) => {
  panelPool[selected].zoom = Number(e.target.value);
  document.getElementById('zoomVal').textContent = `${panelPool[selected].zoom.toFixed(2)}×`;
  redraw();
});
document.getElementById('panX').addEventListener('input', (e) => {
  panelPool[selected].panX = Number(e.target.value);
  redraw();
});
document.getElementById('panY').addEventListener('input', (e) => {
  panelPool[selected].panY = Number(e.target.value);
  redraw();
});

document.getElementById('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});
document.getElementById('titleSize').addEventListener('input', (e) => {
  state.titleScale = Number(e.target.value) / 100;
  document.getElementById('titleSizeVal').textContent = `${e.target.value}%`;
  redraw();
});
document.getElementById('swatches').addEventListener('click', (e) => {
  const sw = e.target.closest('[data-color]');
  if (!sw) return;
  state.titleColor = sw.dataset.color;
  document.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('is-active', s === sw));
  redraw();
});
document.getElementById('grade').addEventListener('change', (e) => {
  state.grade = e.target.value;
  redraw();
});
document.getElementById('exportSize').addEventListener('change', (e) => setSize(e.target.value));

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const fx = (e.clientX - rect.left) / rect.width;
  const fy = (e.clientY - rect.top) / rect.height;
  const hit = panelAt(state.layout, fx, fy);
  if (hit >= 0) {
    selectPanel(hit);
    status.textContent = `Panel ${hit + 1} selected — load a photo or drag its sliders.`;
  }
});

document.getElementById('export').addEventListener('click', () => {
  const [w, h] = state.exportSize.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawScene(off.getContext('2d'), w, h, snapshot(), { highlight: -1 });
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.exportSize}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${state.exportSize}.png`;
    window.__exported = { width: w, height: h, bytes: blob.size };
  }, 'image/png');
});

// The display faces load asynchronously; repaint once they arrive so the
// caption is set in the poster font from the first paint on.
Promise.all([
  document.fonts.load('800 100px "Vice Display"'),
  document.fonts.load('700 40px "Vice Text"'),
]).catch(() => {}).finally(() => redraw());
document.fonts.ready.then(() => redraw());

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    setLayout,
    setSize,
    setCaption: (text) => {
      state.caption = text;
      document.getElementById('caption').value = text;
    },
    setSubtitle: (text) => {
      state.subtitle = text;
      document.getElementById('subtitle').value = text;
    },
    setGrade: (g) => {
      state.grade = g;
      document.getElementById('grade').value = g;
    },
    setTitleColor: (c) => {
      state.titleColor = c;
      document.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('is-active', s.dataset.color === c));
    },
    setCleanPreview: (on) => { cleanPreview = on; },
    panelCount: () => panels().length,
    loadSampleIntoPanel: async (i, name) => {
      panelPool[i].img = await loadImage(`samples/${name}.jpg`);
    },
    redraw,
  });
} else {
  selectPanel(0);
  redraw();
}
