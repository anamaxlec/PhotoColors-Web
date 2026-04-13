
const refs = {
  imageUpload: document.getElementById('imageUpload'),
  exportBtn: document.getElementById('exportBtn'),
  exportBtnSide: document.getElementById('exportBtnSide'),
  locationInput: document.getElementById('locationInput'),
  timeInput: document.getElementById('timeInput'),
  showLocation: document.getElementById('showLocation'),
  showTime: document.getElementById('showTime'),
  fontFamily: document.getElementById('fontFamily'),
  locationSize: document.getElementById('locationSize'),
  timeSize: document.getElementById('timeSize'),
  lineGap: document.getElementById('lineGap'),
  textY: document.getElementById('textY'),
  toneMode: document.getElementById('toneMode'),
  edgeMode: document.getElementById('edgeMode'),
  softness: document.getElementById('softness'),
  locationSizeValue: document.getElementById('locationSizeValue'),
  timeSizeValue: document.getElementById('timeSizeValue'),
  gapValue: document.getElementById('gapValue'),
  textYValue: document.getElementById('textYValue'),
  softnessValue: document.getElementById('softnessValue'),
  exportSize: document.getElementById('exportSize'),
  previewMeta: document.getElementById('previewMeta'),
  previewCanvas: document.getElementById('previewCanvas'),
  placeholder: document.getElementById('placeholder'),
  dropZone: document.getElementById('dropZone'),
  themeToggle: document.getElementById('themeToggle'),
};

if (!refs.exportBtnSide) refs.exportBtnSide = refs.exportBtn;

const previewCtx = refs.previewCanvas.getContext('2d', { alpha: false });
const exportCanvas = document.createElement('canvas');
const exportCtx = exportCanvas.getContext('2d', { alpha: false });

const state = {
  theme: 'auto',
  image: null,
  imageName: 'photocolors-output',
  rawPalette: {
    dominant: { r: 213, g: 219, b: 230 },
    accent: { r: 108, g: 88, b: 72 },
  },
  palette: {
    bg: { r: 213, g: 219, b: 230 },
    text: { r: 96, g: 92, b: 83 },
  },
};

const THEMES = {
  auto: {
    label: '自动取色',
    tint: null,
    tintStrength: 0,
    hueShift: 0,
    satMul: 1,
    lightAdd: 0,
    accentHueShift: 0,
  },
  'soft-rose': {
    label: '柔粉偏移',
    tint: '#e8d8dc',
    tintStrength: 0.10,
    hueShift: 0,
    satMul: 0.96,
    lightAdd: 0.01,
    accentHueShift: -6,
  },
  'mist-blue': {
    label: '雾蓝偏移',
    tint: '#d6dde8',
    tintStrength: 0.12,
    hueShift: -6,
    satMul: 0.92,
    lightAdd: 0,
    accentHueShift: 10,
  },
  'soft-apricot': {
    label: '暖杏偏移',
    tint: '#ecd9c5',
    tintStrength: 0.12,
    hueShift: 8,
    satMul: 0.94,
    lightAdd: 0.01,
    accentHueShift: -10,
  },
  'soft-sand': {
    label: '砂灰偏移',
    tint: '#e0dbd3',
    tintStrength: 0.10,
    hueShift: 2,
    satMul: 0.82,
    lightAdd: 0.01,
    accentHueShift: 4,
  },
};

const FONT_STACKS = {
  apple: {
    location: `600 1px -apple-system,BlinkMacSystemFont,"SF Pro Display","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif`,
    time: `560 1px -apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif`,
  },
  noto: {
    location: `600 1px "Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`,
    time: `560 1px "Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`,
  },
  inter: {
    location: `600 1px Inter,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
    time: `560 1px Inter,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
  },
  jakarta: {
    location: `600 1px "Plus Jakarta Sans","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
    time: `560 1px "Plus Jakarta Sans","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
  },
  manrope: {
    location: `600 1px Manrope,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
    time: `560 1px Manrope,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
  },
  outfit: {
    location: `600 1px Outfit,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
    time: `560 1px Outfit,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
  },
  montserrat: {
    location: `600 1px Montserrat,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
    time: `560 1px Montserrat,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
  },
  nunito: {
    location: `600 1px "Nunito Sans","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
    time: `560 1px "Nunito Sans","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
  },
  ibm: {
    location: `600 1px "IBM Plex Sans","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
    time: `560 1px "IBM Plex Sans","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`,
  },
  'system-soft': {
    location: `540 1px -apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif`,
    time: `500 1px -apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif`,
  },
  'system-tight': {
    location: `650 1px -apple-system,BlinkMacSystemFont,"SF Pro Display","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif`,
    time: `580 1px -apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif`,
  },
};

const UI_THEME_KEY = 'photocolors-ui-theme';

function getInitialUiTheme() {
  const saved = localStorage.getItem(UI_THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyUiTheme(theme) {
  document.documentElement.setAttribute('data-ui-theme', theme);
  localStorage.setItem(UI_THEME_KEY, theme);
}

let themeAnimTimer = null;

function animateThemeToggle() {
  const root = document.documentElement;
  const rect = refs.themeToggle?.getBoundingClientRect();
  if (rect) {
    root.style.setProperty('--theme-burst-x', `${rect.left + rect.width / 2}px`);
    root.style.setProperty('--theme-burst-y', `${rect.top + rect.height / 2}px`);
  }

  root.classList.remove('theme-switching');
  void root.offsetWidth;
  root.classList.add('theme-switching');

  clearTimeout(themeAnimTimer);
  themeAnimTimer = window.setTimeout(() => {
    root.classList.remove('theme-switching');
  }, 520);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function mix(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function luminance({ r, g, b }) {
  const srgb = [r, g, b].map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return srgb[0] * 0.2126 + srgb[1] * 0.7152 + srgb[2] * 0.0722;
}

function contrastRatio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    default: h = (r - g) / d + 4; break;
  }
  return { h: h * 60, s, l };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;

  if (s === 0) {
    const value = Math.round(l * 255);
    return { r: value, g: value, b: value };
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function getFontPreset() {
  return FONT_STACKS[refs.fontFamily.value] || FONT_STACKS.apple;
}

function applyFontSize(template, sizePx) {
  return template.replace('1px', `${sizePx.toFixed(2)}px`);
}

function extractPalette(image) {
  const maxSide = 220;
  const scale = Math.min(maxSide / image.naturalWidth, maxSide / image.naturalHeight, 1);
  const width = Math.max(32, Math.round(image.naturalWidth * scale));
  const height = Math.max(32, Math.round(image.naturalHeight * scale));

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  tempCtx.drawImage(image, 0, 0, width, height);

  const data = tempCtx.getImageData(0, 0, width, height).data;
  const bins = new Map();

  let weightedR = 0;
  let weightedG = 0;
  let weightedB = 0;
  let totalWeight = 0;

  for (let i = 0; i < data.length; i += 20) {
    const a = data[i + 3];
    if (a < 220) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const hsl = rgbToHsl(r, g, b);

    const satWeight = 0.55 + hsl.s * 1.15;
    const lightPenalty = (hsl.l < 0.05 || hsl.l > 0.96) ? 0.15 : 1;
    const weight = satWeight * lightPenalty;

    weightedR += r * weight;
    weightedG += g * weight;
    weightedB += b * weight;
    totalWeight += weight;

    const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`;
    const existing = bins.get(key) || { r: 0, g: 0, b: 0, count: 0, score: 0, sat: 0, light: 0 };
    existing.r += r;
    existing.g += g;
    existing.b += b;
    existing.count += 1;
    existing.score += weight;
    existing.sat += hsl.s;
    existing.light += hsl.l;
    bins.set(key, existing);
  }

  const dominant = totalWeight > 0 ? {
    r: Math.round(weightedR / totalWeight),
    g: Math.round(weightedG / totalWeight),
    b: Math.round(weightedB / totalWeight),
  } : { r: 213, g: 219, b: 230 };

  const candidates = [...bins.values()]
    .map((bin) => ({
      r: Math.round(bin.r / bin.count),
      g: Math.round(bin.g / bin.count),
      b: Math.round(bin.b / bin.count),
      sat: bin.sat / bin.count,
      light: bin.light / bin.count,
      score: bin.score / Math.max(1, bin.count),
    }))
    .sort((a, b) => (b.score + b.sat * 0.8) - (a.score + a.sat * 0.8));

  let accent = candidates.find((item) => item.sat > 0.22 && item.light > 0.12 && item.light < 0.84);
  if (!accent) accent = candidates.find((item) => item.sat > 0.12);
  if (!accent) accent = dominant;

  return {
    dominant,
    accent: { r: accent.r, g: accent.g, b: accent.b },
  };
}

function softenBackground(color, softness = 60) {
  const hsl = rgbToHsl(color.r, color.g, color.b);
  const satFloor = 0.16;
  const satTarget = clamp(Math.max(satFloor, hsl.s * (0.72 - softness / 240)), 0.14, 0.48);
  const lightTarget = clamp(0.70 + softness / 520 + (0.50 - Math.abs(hsl.l - 0.50)) * 0.10, 0.66, 0.84);
  return hslToRgb(hsl.h, satTarget, lightTarget);
}

function applyThemeBias(baseBg, themeName, softness = 60) {
  const theme = THEMES[themeName] || THEMES.auto;
  if (!theme.tint) return baseBg;

  const tint = hexToRgb(theme.tint);
  const mixed = mix(baseBg, tint, theme.tintStrength + softness / 1800);
  const hsl = rgbToHsl(mixed.r, mixed.g, mixed.b);
  return hslToRgb(
    hsl.h + theme.hueShift,
    clamp(hsl.s * theme.satMul, 0.10, 0.44),
    clamp(hsl.l + theme.lightAdd, 0.66, 0.86)
  );
}

function accentFromImage(rawAccent, bg, themeName) {
  const theme = THEMES[themeName] || THEMES.auto;
  const accentHsl = rgbToHsl(rawAccent.r, rawAccent.g, rawAccent.b);
  const bgHsl = rgbToHsl(bg.r, bg.g, bg.b);

  let hue = accentHsl.s > 0.10 ? accentHsl.h : bgHsl.h + 180;
  hue += theme.accentHueShift;

  const sat = clamp(Math.max(accentHsl.s * 1.02, 0.20), 0.20, 0.76);
  const light = luminance(bg) > 0.62
    ? clamp(Math.min(accentHsl.l * 0.72, 0.36), 0.16, 0.42)
    : clamp(Math.max(accentHsl.l * 1.12, 0.62), 0.58, 0.84);

  return hslToRgb(hue, sat, light);
}

function ensureContrast(color, bg, ratio) {
  if (contrastRatio(color, bg) >= ratio) return color;

  const colorHsl = rgbToHsl(color.r, color.g, color.b);
  const darken = luminance(bg) > 0.5;

  for (let i = 1; i <= 24; i += 1) {
    const delta = i * 0.018;
    const candidate = hslToRgb(
      colorHsl.h,
      colorHsl.s,
      clamp(darken ? colorHsl.l - delta : colorHsl.l + delta, 0.08, 0.92),
    );
    if (contrastRatio(candidate, bg) >= ratio) return candidate;
  }
  return color;
}

function createTextColor(accent, bg, toneMode, softness) {
  const bgLum = luminance(bg);
  const hsl = rgbToHsl(accent.r, accent.g, accent.b);
  let color;

  if (toneMode === 'soft') {
    color = hslToRgb(
      hsl.h,
      clamp(hsl.s * 0.56, 0.10, 0.34),
      bgLum > 0.60 ? clamp(hsl.l * 0.94, 0.18, 0.42) : clamp(hsl.l * 1.04, 0.58, 0.84)
    );
    color = mix(color, bg, 0.28 + softness / 450);
    return ensureContrast(color, bg, 2.0);
  }

  if (toneMode === 'balanced') {
    color = hslToRgb(
      hsl.h,
      clamp(hsl.s * 0.82, 0.16, 0.48),
      bgLum > 0.60 ? clamp(hsl.l * 0.88, 0.14, 0.40) : clamp(hsl.l * 1.02, 0.54, 0.84)
    );
    color = mix(color, bg, 0.14 + softness / 950);
    return ensureContrast(color, bg, 2.7);
  }

  if (toneMode === 'vivid') {
    color = hslToRgb(
      hsl.h,
      clamp(hsl.s * 1.06 + 0.04, 0.24, 0.76),
      bgLum > 0.60 ? clamp(hsl.l * 0.82, 0.14, 0.36) : clamp(hsl.l * 1.08, 0.62, 0.90)
    );
    return ensureContrast(color, bg, 3.1);
  }

  color = hslToRgb(
    hsl.h,
    clamp(hsl.s * 0.68, 0.12, 0.42),
    bgLum > 0.60 ? clamp(hsl.l * 0.90, 0.16, 0.38) : clamp(hsl.l * 1.02, 0.56, 0.82)
  );
  color = mix(color, bg, 0.18 + softness / 700);
  return ensureContrast(color, bg, 2.35);
}

function getEdgeStyle(textColor, bg, edgeMode) {
  if (edgeMode === 'none') {
    return { shadowColor: 'transparent', shadowBlur: 0, shadowOffsetY: 0 };
  }
  if (edgeMode === 'mist') {
    const soft = mix(textColor, bg, 0.72);
    return {
      shadowColor: `rgba(${soft.r}, ${soft.g}, ${soft.b}, 0.18)`,
      shadowBlur: 14,
      shadowOffsetY: 0,
    };
  }
  const soft = mix(textColor, bg, 0.62);
  return {
    shadowColor: `rgba(${soft.r}, ${soft.g}, ${soft.b}, 0.18)`,
    shadowBlur: 8,
    shadowOffsetY: 1,
  };
}

function updatePalette() {
  if (!state.image) return;

  const raw = extractPalette(state.image);
  state.rawPalette = raw;

  const softness = Number(refs.softness.value);
  const autoBg = softenBackground(raw.dominant, softness);
  const themedBg = applyThemeBias(autoBg, state.theme, softness);
  const accent = accentFromImage(raw.accent, themedBg, state.theme);
  const text = createTextColor(accent, themedBg, refs.toneMode.value, softness);

  state.palette = { bg: themedBg, text, accent };
}

function syncControlReadouts() {
  refs.locationSizeValue.textContent = `${Number(refs.locationSize.value).toFixed(2)}×`;
  refs.timeSizeValue.textContent = `${Number(refs.timeSize.value).toFixed(2)}×`;
  refs.gapValue.textContent = `${Number(refs.lineGap.value).toFixed(2)}×`;
  refs.textYValue.textContent = `${refs.textY.value}%`;
  refs.softnessValue.textContent = refs.softness.value;
}

function drawCenteredText(ctx, text, x, y, font, color, edge) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = edge.shadowColor;
  ctx.shadowBlur = edge.shadowBlur;
  ctx.shadowOffsetY = edge.shadowOffsetY;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function renderToCanvas(ctx, canvas, maxPreviewWidth = null) {
  if (!state.image) {
    canvas.width = 960;
    canvas.height = 540;
    ctx.fillStyle = '#eff3f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const photoW = state.image.naturalWidth;
  const photoH = state.image.naturalHeight;
  const exportW = photoW;
  const exportH = photoH * 2;

  let targetW = exportW;
  let targetH = exportH;
  let scale = 1;

  if (maxPreviewWidth) {
    scale = Math.min(maxPreviewWidth / exportW, 1);
    targetW = Math.max(1, Math.round(exportW * scale));
    targetH = Math.max(1, Math.round(exportH * scale));
  }

  canvas.width = targetW;
  canvas.height = targetH;

  ctx.clearRect(0, 0, targetW, targetH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const bg = state.palette.bg;
  const text = state.palette.text;
  const topH = Math.round(photoH * scale);
  const bottomY = topH;
  const drawW = Math.round(photoW * scale);
  const drawH = Math.round(photoH * scale);

  ctx.fillStyle = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
  ctx.fillRect(0, 0, targetW, topH);
  ctx.drawImage(state.image, 0, bottomY, drawW, drawH);

  const fontPreset = getFontPreset();
  const baseLocationSize = clamp(exportW * 0.052, 32, 160) * Number(refs.locationSize.value) * scale;
  const baseTimeSize = clamp(baseLocationSize * 0.52, 16, 72) * Number(refs.timeSize.value);
  const lineGap = Math.max(6 * scale, baseTimeSize * 0.36 * Number(refs.lineGap.value));

  const showLocation = refs.showLocation.checked && refs.locationInput.value.trim();
  const showTime = refs.showTime.checked && refs.timeInput.value.trim();

  const blocks = [];
  if (showLocation) {
    blocks.push({
      text: refs.locationInput.value.trim(),
      font: applyFontSize(fontPreset.location, baseLocationSize),
      size: baseLocationSize,
    });
  }
  if (showTime) {
    blocks.push({
      text: refs.timeInput.value.trim(),
      font: applyFontSize(fontPreset.time, baseTimeSize),
      size: baseTimeSize,
    });
  }

  if (blocks.length > 0) {
    const totalHeight = blocks.reduce((sum, item) => sum + item.size, 0) + (blocks.length - 1) * lineGap;
    const centerY = topH * (Number(refs.textY.value) / 100);
    let currentY = centerY - totalHeight / 2;
    const edge = getEdgeStyle(text, bg, refs.edgeMode.value);

    for (const item of blocks) {
      currentY += item.size * 0.82;
      drawCenteredText(ctx, item.text, targetW / 2, currentY, item.font, text, edge);
      currentY += item.size * 0.18 + lineGap;
    }
  }

  if (!maxPreviewWidth) {
    if (refs.exportSize) refs.exportSize.textContent = `${exportW} × ${exportH}`;
    if (refs.previewMeta) refs.previewMeta.textContent = `${exportW} × ${exportH}导出｜原图${photoW} × ${photoH}｜${THEMES[state.theme].label}`;
  }
}

function renderAll() {
  syncControlReadouts();
  if (!state.image) return;

  updatePalette();
  renderToCanvas(exportCtx, exportCanvas, null);
  renderToCanvas(previewCtx, refs.previewCanvas, 1080);

  refs.placeholder?.classList.add('is-hidden');
  if (refs.exportBtn) refs.exportBtn.disabled = false;
  if (refs.exportBtnSide) refs.exportBtnSide.disabled = false;
}

function loadImageFromFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    state.image = image;
    state.imageName = file.name.replace(/\.[^/.]+$/, '') || 'photocolors-output';
    renderAll();
    URL.revokeObjectURL(url);
  };
  image.src = url;
}

function handleExport() {
  if (!state.image) return;

  exportCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${state.imageName}-photocolors.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function activateTheme(themeName) {
  state.theme = themeName;
  document.querySelectorAll('.swatch').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.theme === themeName);
  });
  document.querySelectorAll('.preset-card').forEach((card) => {
    card.classList.toggle('is-active', card.dataset.theme === themeName);
  });
  if (state.image) renderAll();
}

refs.imageUpload.addEventListener('change', (event) => {
  loadImageFromFile(event.target.files?.[0]);
});

[
  refs.locationInput,
  refs.timeInput,
  refs.showLocation,
  refs.showTime,
  refs.fontFamily,
  refs.locationSize,
  refs.timeSize,
  refs.lineGap,
  refs.textY,
  refs.toneMode,
  refs.edgeMode,
  refs.softness,
].forEach((el) => {
  el.addEventListener('input', renderAll);
  el.addEventListener('change', renderAll);
});

refs.exportBtn?.addEventListener('click', handleExport);
if (refs.exportBtnSide && refs.exportBtnSide !== refs.exportBtn) {
  refs.exportBtnSide.addEventListener('click', handleExport);
}

const recolorBtn = document.getElementById('recolorBtn');
recolorBtn?.addEventListener('click', () => {
  if (!state.image) return;
  updatePalette();
  renderAll();
});

document.querySelectorAll('.swatch').forEach((btn) => {
  btn.addEventListener('click', () => activateTheme(btn.dataset.theme));
});

document.querySelectorAll('.preset-card').forEach((card) => {
  card.addEventListener('click', () => activateTheme(card.dataset.theme));
});

refs.dropZone?.addEventListener('dragover', (event) => {
  event.preventDefault();
  refs.dropZone.style.boxShadow = 'inset 0 0 0 2px rgba(26, 115, 232, 0.22)';
});

refs.dropZone?.addEventListener('dragleave', () => {
  refs.dropZone.style.boxShadow = '';
});

refs.dropZone?.addEventListener('drop', (event) => {
  event.preventDefault();
  refs.dropZone.style.boxShadow = '';
  const file = event.dataTransfer.files?.[0];
  if (file && file.type.startsWith('image/')) {
    loadImageFromFile(file);
  }
});

applyUiTheme(getInitialUiTheme());

refs.themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-ui-theme') === 'dark' ? 'dark' : 'light';
  animateThemeToggle();
  applyUiTheme(current === 'dark' ? 'light' : 'dark');
});

syncControlReadouts();
if (refs.exportBtn) refs.exportBtn.disabled = true;
if (refs.exportBtnSide) refs.exportBtnSide.disabled = true;
