// Vice Cover Studio's drawing engine: one drawScene paints the whole poster —
// multi-panel photos, a striped neon sun, palm silhouettes, a sunset grade and
// the bold title band — on any canvas at any export size. No network, no
// library: plain Canvas 2D. The same function draws the live preview and the
// exported PNG, so what you see is what you get.

/** Panel rectangles and the title band, as fractions of the cover. */
export const LAYOUTS = {
  skyline: {
    panels: [
      { x: 0, y: 0, w: 1, h: 0.55 },
      { x: 0, y: 0.7, w: 0.5, h: 0.3 },
      { x: 0.5, y: 0.7, w: 0.5, h: 0.3 },
    ],
    band: { x: 0, y: 0.55, w: 1, h: 0.15 },
  },
  split: {
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.78 },
      { x: 0.5, y: 0, w: 0.5, h: 0.78 },
    ],
    band: { x: 0, y: 0.78, w: 1, h: 0.22 },
  },
  grid: {
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.39 },
      { x: 0.5, y: 0, w: 0.5, h: 0.39 },
      { x: 0, y: 0.39, w: 0.5, h: 0.39 },
      { x: 0.5, y: 0.39, w: 0.5, h: 0.39 },
    ],
    band: { x: 0, y: 0.78, w: 1, h: 0.22 },
  },
  single: {
    panels: [{ x: 0, y: 0, w: 1, h: 0.78 }],
    band: { x: 0, y: 0.78, w: 1, h: 0.22 },
  },
};

/** Colour grades: the sunset wash laid over every panel, plus the sun's hues. */
export const GRADES = {
  sunset: {
    top: 'rgba(255, 122, 24, 0)',
    mid: 'rgba(255, 46, 136, 0.28)',
    bottom: 'rgba(123, 47, 247, 0.45)',
    sunCore: '#fff3c4',
    sunEdge: '#ff7a18',
    bandFrom: '#1c0b2e',
    bandTo: '#4d0f4d',
  },
  neon: {
    top: 'rgba(34, 211, 238, 0)',
    mid: 'rgba(123, 47, 247, 0.34)',
    bottom: 'rgba(255, 46, 136, 0.42)',
    sunCore: '#fdf4ff',
    sunEdge: '#ff2e88',
    bandFrom: '#0b1030',
    bandTo: '#3b0f5e',
  },
  golden: {
    top: 'rgba(255, 211, 25, 0)',
    mid: 'rgba(255, 140, 40, 0.30)',
    bottom: 'rgba(190, 60, 20, 0.42)',
    sunCore: '#fffbe6',
    sunEdge: '#ffb347',
    bandFrom: '#241204',
    bandTo: '#571d12',
  },
};

const DISPLAY_FONT = '"Vice Display", "Arial Narrow", sans-serif';
const TEXT_FONT = '"Vice Text", "Arial", sans-serif';

/** Which panel (index) holds the point (fx, fy) in fractions, or -1. */
export function panelAt(layoutName, fx, fy) {
  const layout = LAYOUTS[layoutName] ?? LAYOUTS.skyline;
  return layout.panels.findIndex(
    (p) => fx >= p.x && fx < p.x + p.w && fy >= p.y && fy < p.y + p.h,
  );
}

/** Cover-fits `img` into `rect`, zoomed and panned by the panel's settings. */
function drawPhotoInto(ctx, img, rect, zoom, panX, panY) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const ox = panX * Math.max(0, (pw - rect.w) / 2);
  const oy = panY * Math.max(0, (ph - rect.h) / 2);
  ctx.drawImage(img, rect.x + (rect.w - pw) / 2 + ox, rect.y + (rect.h - ph) / 2 + oy, pw, ph);
}

/** A palm silhouette: a tapered, leaning trunk and seven drooping frond blades. */
function drawPalm(ctx, x, y, size, lean) {
  const s = size;
  const topX = x + lean * s * 0.5;
  const topY = y - s;
  // Trunk: a tapered shape from the base up to the crown.
  const halfBase = s * 0.035;
  const halfTop = s * 0.018;
  ctx.beginPath();
  ctx.moveTo(x - halfBase, y);
  ctx.quadraticCurveTo(x + lean * s * 0.25 - halfTop, y - s * 0.55, topX - halfTop, topY);
  ctx.lineTo(topX + halfTop, topY);
  ctx.quadraticCurveTo(x + lean * s * 0.25 + halfTop, y - s * 0.55, x + halfBase, y);
  ctx.closePath();
  ctx.fill();
  // Fronds: blades fanning out from the crown. dx runs -1 (left) to +1
  // (right); the middle blades arch upward, the outer blades reach out and
  // droop, so the crown reads as a palm and not a starburst.
  for (let i = 0; i < 7; i += 1) {
    const t = i / 6; // 0 = far left, 1 = far right
    const dx = -1 + 2 * t;
    const up = 1 - Math.abs(dx); // 1 in the middle, 0 at the sides
    const len = s * (0.52 - Math.abs(dx) * 0.1);
    const tipX = topX + dx * len;
    const tipY = topY - up * len * 0.45 + len * 0.24;
    const ctrlX = topX + dx * len * 0.55;
    const ctrlY = topY - up * len * 0.62 - len * 0.04;
    const backX = topX + dx * len * 0.42;
    const backY = topY - up * len * 0.34 + len * 0.12;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    ctx.quadraticCurveTo(backX, backY, topX, topY);
    ctx.closePath();
    ctx.fill();
  }
  // A couple of coconuts under the crown.
  ctx.beginPath();
  ctx.arc(topX - s * 0.03, topY + s * 0.03, s * 0.025, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.035, topY + s * 0.035, s * 0.022, 0, Math.PI * 2);
  ctx.fill();
}

/** The striped synthwave sun: a solid glowing disc, its lower half cut by
 * horizontal slats clipped to the disc, so it reads as a sun, not bars. */
function drawSun(ctx, cx, cy, radius, grade) {
  ctx.save();
  // Outer halo, blended over the photo.
  ctx.globalCompositeOperation = 'screen';
  const halo = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.7);
  halo.addColorStop(0, grade.sunEdge);
  halo.addColorStop(1, 'rgba(255, 46, 136, 0)');
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  // The disc itself, solid enough to see against any photo.
  const disc = ctx.createRadialGradient(cx, cy - radius * 0.25, radius * 0.1, cx, cy, radius);
  disc.addColorStop(0, grade.sunCore);
  disc.addColorStop(0.6, grade.sunEdge);
  disc.addColorStop(1, '#ff2e88');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  // Slats, clipped to the disc and only across its lower half.
  ctx.clip();
  ctx.fillStyle = 'rgba(28, 11, 46, 0.85)';
  for (let i = 0; i < 4; i += 1) {
    const y = cy + radius * (0.12 + i * 0.2);
    const half = Math.sqrt(Math.max(0, radius * radius - (y - cy) * (y - cy)));
    ctx.fillRect(cx - half, y, half * 2, radius * 0.05 + i * radius * 0.014);
  }
  ctx.restore();
}

/** The title band: deep gradient, neon rules, the big title and the subtitle. */
function drawTitleBand(ctx, band, state, grade, w) {
  const fill = ctx.createLinearGradient(band.x, band.y, band.x + band.w, band.y);
  fill.addColorStop(0, grade.bandFrom);
  fill.addColorStop(1, grade.bandTo);
  ctx.fillStyle = fill;
  ctx.fillRect(band.x, band.y, band.w, band.h);

  ctx.fillStyle = 'rgba(255, 211, 25, 0.9)';
  ctx.fillRect(band.x, band.y, band.w, Math.max(2, band.h * 0.03));
  ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
  ctx.fillRect(band.x, band.y + band.h - Math.max(2, band.h * 0.03), band.w, Math.max(2, band.h * 0.03));

  const title = (state.caption || '').trim().toUpperCase();
  if (title) {
    let size = band.h * 0.58 * (state.titleScale ?? 1);
    ctx.font = `800 ${size}px ${DISPLAY_FONT}`;
    try { ctx.letterSpacing = `${Math.max(1, size * 0.02)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(title).width > w * 0.92 && size > 14) {
      size -= 2;
      ctx.font = `800 ${size}px ${DISPLAY_FONT}`;
    }
    ctx.save();
    ctx.translate(band.x + band.w / 2, band.y + band.h * 0.56);
    ctx.rotate(-0.012);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeStyle = 'rgba(18, 5, 32, 0.9)';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 46, 136, 0.75)';
    ctx.shadowBlur = size * 0.16;
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = state.titleColor || '#ffffff';
    ctx.fillText(title, 0, 0);
    ctx.restore();
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }

  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    let size = band.h * 0.15;
    ctx.font = `700 ${size}px ${TEXT_FONT}`;
    try { ctx.letterSpacing = `${size * 0.22}px`; } catch { /* older canvas */ }
    while (ctx.measureText(sub).width > w * 0.86 && size > 8) {
      size -= 1;
      ctx.font = `700 ${size}px ${TEXT_FONT}`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd319';
    ctx.fillText(sub, band.x + band.w / 2, band.y + band.h * 0.87);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

/**
 * Paints the whole cover onto `ctx` at `width` x `height`.
 * state: { layout, panels: [{img, zoom, panX, panY}], caption, subtitle,
 *   titleScale, titleColor, grade }. opts: { highlight } — the panel index to
 * outline for the editor, or -1 for a clean export.
 */
export function drawScene(ctx, width, height, state, opts = {}) {
  const w = width;
  const h = height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.skyline;
  const gutter = Math.max(3, w * 0.008);

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1c0b2e');
  sky.addColorStop(1, '#0d0518');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const rects = layout.panels.map((p) => ({
    x: p.x * w + gutter / 2,
    y: p.y * h + gutter / 2,
    w: p.w * w - gutter,
    h: p.h * h - gutter,
  }));

  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? {};
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (panel.img) {
      drawPhotoInto(ctx, panel.img, rect, panel.zoom ?? 1, panel.panX ?? 0, panel.panY ?? 0);
    } else {
      const empty = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      empty.addColorStop(0, '#3a1c56');
      empty.addColorStop(1, '#1c0b2e');
      ctx.fillStyle = empty;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(244, 238, 247, 0.55)';
      ctx.font = `700 ${Math.max(12, rect.h * 0.09)}px ${TEXT_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    // Sunset wash over the photo, stronger towards the foot of the panel.
    const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    wash.addColorStop(0, grade.top);
    wash.addColorStop(0.55, grade.mid);
    wash.addColorStop(1, grade.bottom);
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();

    // White poster frame around the panel.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Sun and palms live on the hero panel, above the photos but under the frame.
  // The sun sits up in a sky corner, clear of the photo's subject: top right
  // for the wide hero panels, top left for the grid's small top-left panel,
  // where the sample photo's own sunset sits.
  const hero = rects[0];
  const sunSpot = { skyline: [0.76, 0.3, 0.3], split: [0.82, 0.26, 0.28], single: [0.82, 0.26, 0.28], grid: [0.16, 0.26, 0.24] }[state.layout] ?? [0.76, 0.3, 0.3];
  const sunR = Math.min(hero.w, hero.h) * sunSpot[2];
  drawSun(ctx, hero.x + hero.w * sunSpot[0], hero.y + hero.h * sunSpot[1], sunR, grade);
  ctx.fillStyle = 'rgba(22, 8, 36, 0.92)';
  drawPalm(ctx, hero.x + hero.w * 0.07, hero.y + hero.h * 0.99, hero.h * 0.36, -0.35);
  drawPalm(ctx, hero.x + hero.w * 0.93, hero.y + hero.h * 0.99, hero.h * 0.3, 0.4);
  drawPalm(ctx, hero.x + hero.w * 0.17, hero.y + hero.h * 0.99, hero.h * 0.22, -0.2);

  const band = {
    x: layout.band.x * w,
    y: layout.band.y * h,
    w: layout.band.w * w,
    h: layout.band.h * h,
  };
  drawTitleBand(ctx, band, state, grade, w);

  // Vignette, to pull the eye to the middle of the poster.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(10, 0, 20, 0)');
  vig.addColorStop(1, 'rgba(10, 0, 20, 0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  if (opts.highlight >= 0 && rects[opts.highlight]) {
    const r = rects[opts.highlight];
    ctx.save();
    ctx.strokeStyle = '#ffd319';
    ctx.lineWidth = Math.max(3, w * 0.006);
    ctx.setLineDash([w * 0.02, w * 0.012]);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.restore();
  }
}
