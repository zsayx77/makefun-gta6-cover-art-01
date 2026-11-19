// Fixed scenes for screenshots: ?shot=editor shows the editor with sample photos
// loaded; ?shot=cover shows the cover alone at the export size. The query picks
// the layout, size, samples, caption, subtitle, grade and title colour, and
// window.__shotReady is set once the scene is painted with the poster fonts.

export async function runShot(shot, query, scene) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    scene.setCleanPreview(true);
  }

  scene.setLayout(query.get('layout') ?? 'skyline');
  const size = query.get('size');
  if (size) scene.setSize(size);
  if (query.get('caption')) scene.setCaption(query.get('caption'));
  if (query.get('subtitle')) scene.setSubtitle(query.get('subtitle'));
  if (query.get('grade')) scene.setGrade(query.get('grade'));
  if (query.get('color')) scene.setTitleColor(query.get('color'));

  const heroPhoto = query.get('photo') ?? 'pier';
  const otherPhoto = query.get('photo2') ?? heroPhoto;
  for (let i = 0; i < scene.panelCount(); i += 1) {
    await scene.loadSampleIntoPanel(i, i === 0 ? heroPhoto : otherPhoto);
  }

  await document.fonts.ready;
  try {
    await document.fonts.load('800 100px "Vice Display"');
    await document.fonts.load('700 40px "Vice Text"');
  } catch { /* the fallback fonts still draw */ }
  scene.redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
