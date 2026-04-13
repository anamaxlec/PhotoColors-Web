const fileInput = document.getElementById('fileInput');
const locationInput = document.getElementById('locationInput');
const timeInput = document.getElementById('timeInput');
const showLocationInput = document.getElementById('showLocationInput');
const showTimeInput = document.getElementById('showTimeInput');
const fontFamilySelect = document.getElementById('fontFamilySelect');
const locationScaleInput = document.getElementById('locationScaleInput');
const timeScaleInput = document.getElementById('timeScaleInput');
const lineGapInput = document.getElementById('lineGapInput');
const locationScaleValue = document.getElementById('locationScaleValue');
const timeScaleValue = document.getElementById('timeScaleValue');
const lineGapValue = document.getElementById('lineGapValue');
const liveTextPreview = document.getElementById('liveTextPreview');
const autoColorBtn = document.getElementById('autoColorBtn');
const downloadBtn = document.getElementById('downloadBtn');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d', { alpha: false });
const bgSwatch = document.getElementById('bgSwatch');
const textSwatch = document.getElementById('textSwatch');
const bgHexValue = document.getElementById('bgHexValue');
const textHexValue = document.getElementById('textHexValue');
const sizeInfo = document.getElementById('sizeInfo');

const FONT_PRESETS = {
  'apple-cn': {
    location: '700 1px -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
    time: '600 1px -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
    sample: '杭州市 12:59 PM',
  },
  'noto-cn': {
    location: '700 1px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    time: '600 1px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    sample: '杭州市 12:59 PM',
  },
  'inter': {
    location: '700 1px "Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    time: '600 1px "Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    sample: 'Nyhavn 12:59 PM 杭州市',
  },
  'jakarta': {
    location: '700 1px "Plus Jakarta Sans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    time: '600 1px "Plus Jakarta Sans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    sample: 'Nyhavn 12:59 PM 杭州市',
  },
  'manrope': {
    location: '700 1px "Manrope", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    time: '600 1px "Manrope", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    sample: 'Nyhavn 12:59 PM 杭州市',
  },
  'outfit': {
    location: '700 1px "Outfit", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    time: '600 1px "Outfit", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    sample: 'Nyhavn 12:59 PM 杭州市',
  },
  'montserrat': {
    location: '700 1px "Montserrat", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    time: '600 1px "Montserrat", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    sample: 'Nyhavn 12:59 PM 杭州市',
  },
  'nunito': {
    location: '700 1px "Nunito Sans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    time: '600 1px "Nunito Sans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    sample: 'Nyhavn 12:59 PM 杭州市',
  },
  'ibm-plex': {
    location: '700 1px "IBM Plex Sans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    time: '600 1px "IBM Plex Sans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    sample: 'Nyhavn 12:59 PM 杭州市',
  },
};

let currentImage = null;
let currentFileName = 'photocolors-output';
let drawRaf = 0;
let currentPalette = {
  background: { r: 220, g: 222, b: 226 },
  text: { r: 143, g: 86, b: 57 },
  bgHex: '#DCDEE2',
  textHex: '#8F5639',
};

const renderCanvas = document.createElement('canvas');
const renderCtx = renderCanvas.getContext('2d', { alpha: false });

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function mix(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function luminance({ r, g, b }) {
  const srgb = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
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

function hueDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function hueInRange(h, start, end) {
  const hue = ((h % 360) + 360) % 360;
  if (start <= end) return hue >= start && hue <= end;
  return hue >= start || hue <= end;
}

function bandCenter(band) {
  if (band.start <= band.end) return (band.start + band.end) / 2;
  return ((band.start + band.end + 360) / 2) % 360;
}

function getAccentProfile(bgHsl) {
  if (bgHsl.s < 0.12) {
    return {
      bands: [
        { start: 355, end: 28, weight: 42 },
        { start: 18, end: 52, weight: 34 },
        { start: 210, end: 255, weight: 16 },
      ],
      targetLight: 'dark',
      targetSat: 0.56,
      minRatio: 4.7,
    };
  }

  if (hueInRange(bgHsl.h, 345, 32) || hueInRange(bgHsl.h, 32, 58)) {
    return {
      bands: [
        { start: 40, end: 68, weight: 44 },
        { start: 20, end: 40, weight: 30 },
        { start: 72, end: 110, weight: 18 },
      ],
      targetLight: 'light',
      targetSat: 0.64,
      minRatio: 3.6,
    };
  }

  if (hueInRange(bgHsl.h, 185, 270)) {
    return {
      bands: [
        { start: 8, end: 36, weight: 40 },
        { start: 345, end: 8, weight: 30 },
        { start: 36, end: 62, weight: 18 },
      ],
      targetLight: 'dark',
      targetSat: 0.6,
      minRatio: 4.8,
    };
  }

  if (hueInRange(bgHsl.h, 80, 170)) {
    return {
      bands: [
        { start: 345, end: 16, weight: 38 },
        { start: 16, end: 40, weight: 28 },
        { start: 260, end: 305, weight: 14 },
      ],
      targetLight: 'dark',
      targetSat: 0.6,
      minRatio: 4.8,
    };
  }

  return {
    bands: [
      { start: 345, end: 20, weight: 32 },
      { start: 35, end: 64, weight: 24 },
      { start: 220, end: 255, weight: 14 },
    ],
    targetLight: 'dark',
    targetSat: 0.58,
    minRatio: 4.7,
  };
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
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
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function softenBackground(color) {
  const hsl = rgbToHsl(color.r, color.g, color.b);
  const targetS = Math.min(0.38, Math.max(0.08, hsl.s * 0.65));
  const targetL = Math.min(0.82, Math.max(0.68, hsl.l * 0.92 + 0.18));
  return hslToRgb(hsl.h, targetS, targetL);
}

function stylizePosterAccent(base, bg, profile) {
  const bgHsl = rgbToHsl(bg.r, bg.g, bg.b);
  const accentHsl = rgbToHsl(base.r, base.g, base.b);

  let targetHue = accentHsl.h;
  const bandMatch = profile.bands.find((band) => hueInRange(targetHue, band.start, band.end));
  if (!bandMatch || accentHsl.s < 0.16 || hueDistance(targetHue, bgHsl.h) < 8) {
    targetHue = bandCenter(profile.bands[0]);
  }

  let targetSat = clamp(Math.max(accentHsl.s, profile.targetSat), 0.42, 0.8);
  let targetLight = profile.targetLight === 'light'
    ? clamp(Math.max(accentHsl.l, 0.74), 0.68, 0.86)
    : clamp(Math.min(accentHsl.l, 0.38), 0.18, 0.46);

  let candidate = hslToRgb(targetHue, targetSat, targetLight);
  if (contrastRatio(candidate, bg) >= profile.minRatio) return candidate;

  for (let i = 1; i <= 18; i += 1) {
    const t = i / 18;
    const light = profile.targetLight === 'light'
      ? clamp(targetLight + t * 0.18, 0, 0.94)
      : clamp(targetLight - t * 0.18, 0.08, 1);
    const sat = clamp(targetSat + t * 0.1, 0, 0.9);
    candidate = hslToRgb(targetHue, sat, light);
    if (contrastRatio(candidate, bg) >= profile.minRatio) return candidate;
  }

  const fallbackHue = bandCenter(profile.bands[0]);
  return profile.targetLight === 'light'
    ? hslToRgb(fallbackHue, clamp(profile.targetSat + 0.1, 0, 0.88), 0.9)
    : hslToRgb(fallbackHue, clamp(profile.targetSat + 0.08, 0, 0.88), 0.24);
}

function pushContrast(color, bg, minRatio) {
  if (contrastRatio(color, bg) >= minRatio) return color;

  const hsl = rgbToHsl(color.r, color.g, color.b);
  const preferLighter = luminance(color) >= luminance(bg);

  for (let i = 1; i <= 18; i += 1) {
    const delta = i * 0.025;
    const candidate = hslToRgb(
      hsl.h,
      hsl.s,
      preferLighter ? clamp(hsl.l + delta, 0, 0.97) : clamp(hsl.l - delta, 0.08, 1),
    );
    if (contrastRatio(candidate, bg) >= minRatio) return candidate;
  }

  return color;
}

function refineTypographyColor(accent, bg) {
  const accentHsl = rgbToHsl(accent.r, accent.g, accent.b);
  const bgHsl = rgbToHsl(bg.r, bg.g, bg.b);
  const bgLum = luminance(bg);
  const accentLum = luminance(accent);

  const toned = hslToRgb(
    accentHsl.h,
    clamp(accentHsl.s * 0.84, 0.18, 0.62),
    accentLum >= bgLum
      ? clamp(accentHsl.l * 0.98 + 0.01, 0.54, 0.88)
      : clamp(accentHsl.l * 0.92 + 0.02, 0.16, 0.44),
  );

  const blendAmount = bgHsl.s < 0.14 ? 0.14 : 0.17;
  const mixed = mix(toned, bg, blendAmount);
  const targetRatio = bgLum > 0.62 ? 3.25 : 3.0;
  return pushContrast(mixed, bg, targetRatio);
}

function extractPaletteCandidates(img) {
  const temp = document.createElement('canvas');
  const ctx = temp.getContext('2d', { willReadFrequently: true });
  const maxSide = 220;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  temp.width = w;
  temp.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const bins = new Map();
  for (let i = 0; i < data.length; i += 12) {
    const a = data[i + 3];
    if (a < 200) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    const key = `${qr},${qg},${qb}`;

    const prev = bins.get(key) || { r: 0, g: 0, b: 0, count: 0 };
    prev.r += r;
    prev.g += g;
    prev.b += b;
    prev.count += 1;
    bins.set(key, prev);
  }

  return [...bins.values()].map((item) => {
    const color = {
      r: Math.round(item.r / item.count),
      g: Math.round(item.g / item.count),
      b: Math.round(item.b / item.count),
    };
    const hsl = rgbToHsl(color.r, color.g, color.b);
    const luma = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
    return { color, count: item.count, hsl, luma };
  }).sort((a, b) => b.count - a.count);
}

function chooseBackgroundColor(candidates) {
  if (!candidates.length) return { r: 220, g: 222, b: 226 };

  let best = candidates[0];
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const { color, hsl, luma, count } = candidate;
    if (luma < 18 || luma > 245) continue;

    let score = count;
    if (luma > 70 && luma < 220) score += 64;
    if (hsl.s > 0.04 && hsl.s < 0.68) score += 30;
    if (hsl.l > 0.18 && hsl.l < 0.75) score += 18;
    if (hsl.s < 0.08) score += 12;

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return softenBackground(best.color);
}

function chooseTextColor(candidates, bg) {
  const bgHsl = rgbToHsl(bg.r, bg.g, bg.b);
  const bgLum = luminance(bg);
  const profile = getAccentProfile(bgHsl);
  let best = null;
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const { color, hsl, luma, count } = candidate;
    if (count < 2) continue;

    const ratio = contrastRatio(color, bg);
    const hueGap = hueDistance(hsl.h, bgHsl.h);
    let score = count * 0.18 + ratio * 18 + hsl.s * 95;

    if (hueGap > 14) score += Math.min(hueGap, 90) * 0.26;
    if (hueGap < 8) score -= 36;
    if (hsl.s < 0.12) score -= 42;

    for (const band of profile.bands) {
      if (hueInRange(hsl.h, band.start, band.end)) score += band.weight;
    }

    if (profile.targetLight === 'dark') {
      if (luma < 150) score += 28;
      if (luma > 205) score -= 46;
    } else {
      if (luma > 150) score += 30;
      if (luma < 95) score -= 20;
    }

    if (bgLum > 0.62 && hsl.l < 0.48) score += 14;
    if (bgLum < 0.42 && hsl.l > 0.58) score += 14;

    if (score > bestScore) {
      bestScore = score;
      best = color;
    }
  }

  if (!best) {
    const fallbackHue = bandCenter(profile.bands[0]);
    best = profile.targetLight === 'light'
      ? hslToRgb(fallbackHue, Math.max(profile.targetSat, 0.62), 0.8)
      : hslToRgb(fallbackHue, Math.max(profile.targetSat, 0.56), 0.32);
  }

  return refineTypographyColor(stylizePosterAccent(best, bg, profile), bg);
}

function refreshPalette() {
  if (!currentImage) return;
  const candidates = extractPaletteCandidates(currentImage);
  const background = chooseBackgroundColor(candidates);
  const text = chooseTextColor(candidates, background);

  currentPalette = {
    background,
    text,
    bgHex: rgbToHex(background.r, background.g, background.b),
    textHex: rgbToHex(text.r, text.g, text.b),
  };

  scheduleDraw();
}

function computeLayout(img) {
  const photoW = img.naturalWidth;
  const photoH = img.naturalHeight;
  const topH = photoH;
  const canvasW = photoW;
  const canvasH = photoH * 2;
  return { photoW, photoH, topH, canvasW, canvasH };
}

function getFontPreset() {
  return FONT_PRESETS[fontFamilySelect.value] || FONT_PRESETS['apple-cn'];
}

function applyFontTemplate(template, size) {
  return template.replace('1px', `${Number(size).toFixed(2)}px`);
}

function configureContextQuality(ctx) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

function drawTextLayer(targetCtx, canvasW, topH, textColor, parts) {
  const scale = 2;
  const textCanvas = document.createElement('canvas');
  textCanvas.width = Math.max(1, Math.round(canvasW * scale));
  textCanvas.height = Math.max(1, Math.round(topH * scale));

  const tctx = textCanvas.getContext('2d', { alpha: true });
  configureContextQuality(tctx);
  tctx.scale(scale, scale);
  tctx.fillStyle = `rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`;
  tctx.textAlign = 'center';
  tctx.textBaseline = 'alphabetic';

  const totalTextHeight =
    parts.reduce((sum, part) => sum + part.height, 0) +
    parts.slice(0, -1).reduce((sum, part) => sum + (part.gapAfter || 0), 0);

  let currentTop = topH * 0.5 - totalTextHeight / 2;

  for (const part of parts) {
    tctx.font = part.font;
    const baselineY = currentTop + part.height * 0.8;
    tctx.fillText(part.text, canvasW / 2, baselineY);
    currentTop += part.height + (part.gapAfter || 0);
  }

  configureContextQuality(targetCtx);
  targetCtx.drawImage(textCanvas, 0, 0, canvasW, topH);
}

function addSubtleGrain(ctx, x, y, w, h, opacity = 0.02, strength = 6) {
  if (w < 2 || h < 2 || opacity <= 0 || strength <= 0) return;

  const img = ctx.getImageData(x, y, w, h);
  const data = img.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * strength * 255 * opacity;
    data[i] = clamp(data[i] + noise, 0, 255);
    data[i + 1] = clamp(data[i + 1] + noise, 0, 255);
    data[i + 2] = clamp(data[i + 2] + noise, 0, 255);
  }

  ctx.putImageData(img, x, y);
}

async function ensureSelectedFontsReady() {
  if (!document.fonts || !document.fonts.load) return;
  const preset = getFontPreset();
  const sampleText = preset.sample || 'Hangzhou 12:59 PM 杭州市';
  const layoutWidth = currentImage ? currentImage.naturalWidth : previewCanvas.width;
  const locationSize = Math.max(24, layoutWidth * 0.036) * Number(locationScaleInput.value || 1);
  const timeSize = Math.max(14, layoutWidth * 0.018) * Number(timeScaleInput.value || 1);

  const locationFont = applyFontTemplate(preset.location, locationSize);
  const timeFont = applyFontTemplate(preset.time, timeSize);

  try {
    await Promise.all([
      document.fonts.load(locationFont, sampleText),
      document.fonts.load(timeFont, sampleText),
      document.fonts.ready,
    ]);
  } catch (_) {
    // ignore
  }
}

function updateControlReadout() {
  locationScaleValue.textContent = `${Number(locationScaleInput.value).toFixed(2)}×`;
  timeScaleValue.textContent = `${Number(timeScaleInput.value).toFixed(2)}×`;
  lineGapValue.textContent = `${Number(lineGapInput.value).toFixed(2)}×`;

  const chunks = [];
  if (showLocationInput.checked && locationInput.value.trim()) chunks.push(locationInput.value.trim());
  if (showTimeInput.checked && timeInput.value.trim()) chunks.push(timeInput.value.trim());
  liveTextPreview.textContent = chunks.length ? chunks.join(' / ') : '当前没有显示任何文字';
}

function scheduleDraw() {
  updateControlReadout();
  if (drawRaf) cancelAnimationFrame(drawRaf);
  drawRaf = requestAnimationFrame(() => {
    drawRaf = 0;
    void drawComposition();
  });
}

async function drawComposition() {
  if (!currentImage) return;

  const { photoW, photoH, topH, canvasW, canvasH } = computeLayout(currentImage);
  renderCanvas.width = canvasW;
  renderCanvas.height = canvasH;
  await ensureSelectedFontsReady();

  const bg = currentPalette.background;
  const text = currentPalette.text;

  configureContextQuality(renderCtx);
  renderCtx.save();
  renderCtx.clearRect(0, 0, canvasW, canvasH);
  renderCtx.fillStyle = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
  renderCtx.fillRect(0, 0, canvasW, topH);
  renderCtx.drawImage(currentImage, 0, topH, photoW, photoH);
  addSubtleGrain(renderCtx, 0, topH, photoW, photoH, 0.018, 5.5);

  const location = (locationInput.value || '').trim();
  const time = (timeInput.value || '').trim();
  const showLocation = showLocationInput.checked && Boolean(location);
  const showTime = showTimeInput.checked && Boolean(time);

  const preset = getFontPreset();
  const baseLocationSize = Math.max(30, canvasW * 0.036);
  const baseTimeSize = Math.max(16, canvasW * 0.018);
  const locationFontSize = baseLocationSize * Number(locationScaleInput.value || 1);
  const timeFontSize = baseTimeSize * Number(timeScaleInput.value || 1);
  const lineGap = Math.max(0, canvasW * 0.012 * Number(lineGapInput.value || 1));

  const textBlockParts = [];
  if (showLocation) {
    textBlockParts.push({
      text: location,
      font: applyFontTemplate(preset.location, locationFontSize),
      height: locationFontSize,
      gapAfter: showTime ? lineGap : 0,
    });
  }
  if (showTime) {
    textBlockParts.push({
      text: time,
      font: applyFontTemplate(preset.time, timeFontSize),
      height: timeFontSize,
      gapAfter: 0,
    });
  }

  if (textBlockParts.length) {
    drawTextLayer(renderCtx, canvasW, topH, text, textBlockParts);
  }

  renderCtx.restore();

  previewCanvas.width = canvasW;
  previewCanvas.height = canvasH;
  configureContextQuality(previewCtx);
  previewCtx.clearRect(0, 0, canvasW, canvasH);
  previewCtx.drawImage(renderCanvas, 0, 0);

  bgSwatch.style.background = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
  textSwatch.style.background = `rgb(${text.r}, ${text.g}, ${text.b})`;
  bgHexValue.textContent = currentPalette.bgHex;
  textHexValue.textContent = currentPalette.textHex;
  sizeInfo.textContent = `${canvasW} × ${canvasH}导出｜原图${photoW} × ${photoH}`;
}

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      currentFileName = (file.name || 'photocolors-output').replace(/\.[^.]+$/, '');
      refreshPalette();
      downloadBtn.disabled = false;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function bindLiveRedraw(el, eventName = 'input') {
  el.addEventListener(eventName, scheduleDraw);
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  loadImage(file);
});

bindLiveRedraw(locationInput);
bindLiveRedraw(timeInput);
bindLiveRedraw(showLocationInput, 'change');
bindLiveRedraw(showTimeInput, 'change');
bindLiveRedraw(fontFamilySelect, 'change');
bindLiveRedraw(locationScaleInput);
bindLiveRedraw(timeScaleInput);
bindLiveRedraw(lineGapInput);
autoColorBtn.addEventListener('click', refreshPalette);

updateControlReadout();

downloadBtn.addEventListener('click', async () => {
  if (!currentImage) return;
  await drawComposition();
  renderCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFileName}-photocolors.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
});
