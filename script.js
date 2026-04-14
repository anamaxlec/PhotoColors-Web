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
  sceneType: 'neutral',
  rawPalette: {
    dominant: { r: 213, g: 219, b: 230 },
    accent: { r: 108, g: 88, b: 72 },
  },
  palette: {
    bg: { r: 213, g: 219, b: 230 },
    text: { r: 96, g: 92, b: 83 },
    accent: { r: 108, g: 88, b: 72 },
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
  },
  'soft-rose': {
    label: '柔粉偏移',
    tint: '#e8d8dc',
    tintStrength: 0.10,
    hueShift: 0,
    satMul: 0.96,
    lightAdd: 0.01,
  },
  'mist-blue': {
    label: '雾蓝偏移',
    tint: '#d6dde8',
    tintStrength: 0.12,
    hueShift: -6,
    satMul: 0.92,
    lightAdd: 0,
  },
  'soft-apricot': {
    label: '暖杏偏移',
    tint: '#ecd9c5',
    tintStrength: 0.12,
    hueShift: 8,
    satMul: 0.94,
    lightAdd: 0.01,
  },
  'soft-sand': {
    label: '砂灰偏移',
    tint: '#e0dbd3',
    tintStrength: 0.10,
    hueShift: 2,
    satMul: 0.82,
    lightAdd: 0.01,
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

function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

function quantizeColor(r, g, b) {
  const hsl = rgbToHsl(r, g, b);
  return {
    key: `${Math.round(hsl.h / 16)}-${Math.round(hsl.s * 10)}-${Math.round(hsl.l * 10)}`,
    hsl,
  };
}

function pickSceneType(stats) {
  const total = Math.max(stats.totalWeight, 1);
  const darkRatio = stats.darkWeight / total;
  const blueRatio = stats.blueWeight / total;
  const warmRatio = stats.warmWeight / total;
  const neutralRatio = stats.neutralWeight / total;
  const brightRatio = stats.brightWeight / total;
  const nightBaseRatio = stats.nightBaseWeight / total;

  if (darkRatio > 0.40 && blueRatio > 0.12 && nightBaseRatio > 0.18) return 'night-cool';
  if (darkRatio > 0.40 && stats.warmLightWeight / total > 0.07 && nightBaseRatio > 0.14) return 'night-warm';
  if (blueRatio > 0.18 && brightRatio > 0.22) return 'airy-blue';
  if (warmRatio > 0.24) return 'warm';
  if (neutralRatio > 0.28) return 'neutral';
  return 'soft-natural';
}

function scoreDominantCandidate(candidate, sceneType) {
  const { h, s, l } = candidate.hsl;
  let score = candidate.weight * 1.7 + candidate.count * 0.5;

  if (l < 0.05 || l > 0.90) score -= 10;

  if (sceneType === 'night-cool') {
    if (l >= 0.08 && l <= 0.26) score += 8;
    if (h >= 195 && h <= 240) score += 6;
    if (s >= 0.08 && s <= 0.32) score += 4;
    if (l > 0.36) score -= 6;
    if (h >= 12 && h <= 55 && s > 0.20 && l > 0.28) score -= 7;
  } else if (sceneType === 'night-warm') {
    if (l >= 0.10 && l <= 0.28) score += 8;
    if ((h >= 18 && h <= 45) || s < 0.16) score += 5;
    if (s >= 0.06 && s <= 0.28) score += 4;
    if (l > 0.38) score -= 6;
    if (h >= 18 && h <= 55 && s > 0.24 && l > 0.34) score -= 6;
  } else if (sceneType === 'airy-blue') {
    if (l >= 0.60 && l <= 0.86) score += 7;
    if ((h >= 185 && h <= 235) || s < 0.12) score += 5;
    if (s >= 0.10 && s <= 0.38) score += 3.5;
  } else if (sceneType === 'warm') {
    if (l >= 0.38 && l <= 0.76) score += 6;
    if ((h >= 20 && h <= 55) || (s < 0.16 && l > 0.45)) score += 5;
    if (s >= 0.14 && s <= 0.50) score += 3.5;
  } else if (sceneType === 'neutral') {
    if (l >= 0.46 && l <= 0.76) score += 6;
    if (s >= 0.04 && s <= 0.22) score += 5;
    if (h >= 35 && h <= 95) score += 1.2;
  } else {
    if (l >= 0.44 && l <= 0.80) score += 6;
    if (s >= 0.08 && s <= 0.34) score += 4;
  }

  return score;
}

function scoreAccentCandidate(candidate, dominant, sceneType) {
  const { h, s, l } = candidate.hsl;
  const dominantHsl = dominant.hsl;

  let score = candidate.weight * 1.2 + candidate.count * 0.35;
  const hd = hueDistance(h, dominantHsl.h);

  if (l < 0.10 || l > 0.88) score -= 4;
  if (s < 0.10) score -= 2.5;
  if (hd < 6 && Math.abs(l - dominantHsl.l) < 0.08) score -= 3;

  if (sceneType === 'night-cool') {
    if ((h >= 195 && h <= 240) || (h >= 8 && h <= 32)) score += 4;
    if (s >= 0.12 && s <= 0.42) score += 3;
    if (l >= 0.14 && l <= 0.42) score += 3;
    if (hd >= 10 && hd <= 80) score += 1.8;
  } else if (sceneType === 'night-warm') {
    if (h >= 15 && h <= 48) score += 4.5;
    if (s >= 0.18 && s <= 0.55) score += 3.5;
    if (l >= 0.16 && l <= 0.42) score += 2.5;
  } else if (sceneType === 'airy-blue') {
    if ((h >= 200 && h <= 240) || (h >= 10 && h <= 40)) score += 3.5;
    if (s >= 0.14 && s <= 0.50) score += 3;
    if (l >= 0.20 && l <= 0.50) score += 2.5;
  } else if (sceneType === 'warm') {
    if (h >= 12 && h <= 42) score += 4;
    if (s >= 0.18 && s <= 0.62) score += 3;
    if (l >= 0.18 && l <= 0.44) score += 2.5;
  } else if (sceneType === 'neutral') {
    if (s >= 0.10 && s <= 0.36) score += 3;
    if (l >= 0.16 && l <= 0.42) score += 3;
    if (hd >= 10 && hd <= 55) score += 1.5;
  } else {
    if (s >= 0.14 && s <= 0.46) score += 3;
    if (l >= 0.18 && l <= 0.46) score += 3;
  }

  return score;
}

function extractPalette(image) {
  const maxSide = 260;
  const scale = Math.min(maxSide / image.naturalWidth, maxSide / image.naturalHeight, 1);
  const width = Math.max(40, Math.round(image.naturalWidth * scale));
  const height = Math.max(40, Math.round(image.naturalHeight * scale));

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  tempCtx.drawImage(image, 0, 0, width, height);

  const data = tempCtx.getImageData(0, 0, width, height).data;
  const bins = new Map();

  const stats = {
    totalWeight: 0,
    darkWeight: 0,
    brightWeight: 0,
    skyWeight: 0,
    warmWeight: 0,
    warmLightWeight: 0,
    neutralWeight: 0,
    blueWeight: 0,
    nightBaseWeight: 0,
  };

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 220) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const { key, hsl } = quantizeColor(r, g, b);
      const { h, s, l } = hsl;

      const isUpper = y < height * 0.58;
      const isCenter = x > width * 0.18 && x < width * 0.82;
      const nearBorder = x < width * 0.10 || x > width * 0.90 || y < height * 0.06 || y > height * 0.94;
      const borderWeight = nearBorder ? 0.18 : 1;
      const regionWeight = (isUpper ? 1.10 : 1) * (isCenter ? 1.10 : 1) * borderWeight;

      let colorWeight = 1;

      if (l < 0.03) continue;
      if (l > 0.96) continue;
      if (l > 0.92 && s < 0.08) continue;

      if (l < 0.08 || l > 0.90) colorWeight *= 0.45;
      if (s >= 0.08 && s <= 0.38) colorWeight *= 1.10;
      if (s > 0.70) colorWeight *= 0.75;

      if (h >= 12 && h <= 55 && s > 0.24 && l > 0.42) colorWeight *= 0.58;

      const weight = regionWeight * colorWeight;

      stats.totalWeight += weight;
      if (l < 0.16) stats.darkWeight += weight;
      if (l > 0.72) stats.brightWeight += weight;
      if (isUpper && h >= 185 && h <= 240 && s > 0.10 && l > 0.45) stats.skyWeight += weight;
      if (h >= 16 && h <= 55 && s > 0.14 && l > 0.14 && l < 0.82) stats.warmWeight += weight;
      if (h >= 16 && h <= 55 && s > 0.14 && l > 0.26) stats.warmLightWeight += weight;
      if (s < 0.18 && l > 0.18 && l < 0.82) stats.neutralWeight += weight;

      const isBlue = h >= 190 && h <= 240 && s > 0.10 && l > 0.06 && l < 0.55;
      const isNightBase = l >= 0.05 && l <= 0.28 && s <= 0.32;

      if (isBlue) stats.blueWeight += weight;
      if (isNightBase) stats.nightBaseWeight += weight;

      const existing = bins.get(key) || {
        r: 0, g: 0, b: 0,
        count: 0,
        weight: 0,
        h: 0, s: 0, l: 0,
      };

      existing.r += r * weight;
      existing.g += g * weight;
      existing.b += b * weight;
      existing.h += h * weight;
      existing.s += s * weight;
      existing.l += l * weight;
      existing.count += 1;
      existing.weight += weight;

      bins.set(key, existing);
    }
  }

  const candidates = [...bins.values()]
    .filter((bin) => bin.weight > 0.4)
    .map((bin) => {
      const rgb = {
        r: Math.round(bin.r / bin.weight),
        g: Math.round(bin.g / bin.weight),
        b: Math.round(bin.b / bin.weight),
      };
      const hsl = {
        h: bin.h / bin.weight,
        s: bin.s / bin.weight,
        l: bin.l / bin.weight,
      };
      return {
        ...rgb,
        hsl,
        count: bin.count,
        weight: bin.weight,
      };
    });

  const sceneType = pickSceneType(stats);

  let dominant = candidates[0];
  let bestDominantScore = -Infinity;

  for (const candidate of candidates) {
    const score = scoreDominantCandidate(candidate, sceneType);
    if (score > bestDominantScore) {
      bestDominantScore = score;
      dominant = candidate;
    }
  }

  if (!dominant) {
    dominant = { r: 213, g: 219, b: 230, hsl: rgbToHsl(213, 219, 230) };
  }

  let accent = dominant;
  let bestAccentScore = -Infinity;

  for (const candidate of candidates) {
    const score = scoreAccentCandidate(candidate, dominant, sceneType);
    if (score > bestAccentScore) {
      bestAccentScore = score;
      accent = candidate;
    }
  }

  return {
    dominant: { r: dominant.r, g: dominant.g, b: dominant.b },
    accent: { r: accent.r, g: accent.g, b: accent.b },
    sceneType,
  };
}

function softenBackground(color, softness = 60, sceneType = 'neutral') {
  const hsl = rgbToHsl(color.r, color.g, color.b);
  const t = clamp(softness / 100, 0, 1);

  let targetS = hsl.s;
  let targetL = hsl.l;

  if (sceneType === 'night-cool') {
    targetS = clamp(hsl.s * (0.82 - t * 0.06), 0.08, 0.24);
    targetL = clamp(hsl.l + 0.01 + t * 0.02, 0.12, 0.24);
  } else if (sceneType === 'night-warm') {
    targetS = clamp(hsl.s * (0.78 - t * 0.06), 0.08, 0.28);
    targetL = clamp(hsl.l + 0.01 + t * 0.02, 0.14, 0.26);
  } else if (sceneType === 'airy-blue') {
    targetS = clamp(hsl.s * (0.96 - t * 0.08), 0.12, 0.42);
    targetL = clamp(hsl.l + 0.03 + t * 0.04, 0.64, 0.84);
  } else if (sceneType === 'warm') {
    targetS = clamp(hsl.s * (0.94 - t * 0.10), 0.14, 0.48);
    targetL = clamp(hsl.l + 0.02 + t * 0.03, 0.42, 0.74);
  } else if (sceneType === 'neutral') {
    targetS = clamp(Math.max(hsl.s * 0.78, 0.05), 0.05, 0.20);
    targetL = clamp(hsl.l + 0.04 + t * 0.03, 0.56, 0.78);
  } else {
    targetS = clamp(hsl.s * (0.90 - t * 0.10), 0.08, 0.34);
    targetL = clamp(hsl.l + 0.03 + t * 0.03, 0.50, 0.78);
  }

  return hslToRgb(hsl.h, targetS, targetL);
}

function applyThemeBias(baseBg, themeName, softness = 60, sceneType = 'neutral') {
  const theme = THEMES[themeName] || THEMES.auto;
  if (!theme.tint) return baseBg;

  const tint = hexToRgb(theme.tint);
  const mixed = mix(baseBg, tint, theme.tintStrength + softness / 1800);
  const hsl = rgbToHsl(mixed.r, mixed.g, mixed.b);

  let minL = 0.66;
  let maxL = 0.86;

  if (sceneType === 'night-cool') {
    minL = 0.12;
    maxL = 0.26;
  } else if (sceneType === 'night-warm') {
    minL = 0.14;
    maxL = 0.30;
  } else if (sceneType === 'warm') {
    minL = 0.42;
    maxL = 0.74;
  } else if (sceneType === 'neutral') {
    minL = 0.56;
    maxL = 0.78;
  } else {
    minL = 0.50;
    maxL = 0.78;
  }

  return hslToRgb(
    hsl.h + theme.hueShift,
    clamp(hsl.s * theme.satMul, 0.08, 0.44),
    clamp(hsl.l + theme.lightAdd, minL, maxL)
  );
}

function accentFromImage(rawAccent, bg, sceneType = 'neutral') {
  const accentHsl = rgbToHsl(rawAccent.r, rawAccent.g, rawAccent.b);
  const bgHsl = rgbToHsl(bg.r, bg.g, bg.b);
  const bgLum = luminance(bg);

  let hue = accentHsl.h;
  let sat = accentHsl.s;
  let light = accentHsl.l;

  if (accentHsl.s < 0.10) {
    if (sceneType === 'night-warm' || sceneType === 'warm') {
      hue = 28;
    } else if (sceneType === 'night-cool') {
      hue = bgHsl.h >= 190 && bgHsl.h <= 240 ? bgHsl.h : 220;
    } else if (sceneType === 'airy-blue') {
      hue = bgHsl.h >= 180 && bgHsl.h <= 235 ? bgHsl.h - 12 : 215;
    } else {
      hue = bgHsl.h + 18;
    }
  }

  if (sceneType === 'night-cool') {
    sat = clamp(Math.max(sat * 0.72, 0.10), 0.10, 0.30);
    light = bgLum > 0.50 ? 0.28 : 0.78;
  } else if (sceneType === 'night-warm') {
    sat = clamp(Math.max(sat * 0.76, 0.12), 0.12, 0.34);
    light = bgLum > 0.50 ? 0.26 : 0.78;
  } else if (sceneType === 'airy-blue') {
    sat = clamp(Math.max(sat * 0.86, 0.14), 0.14, 0.42);
    light = bgLum > 0.50 ? 0.30 : 0.76;
  } else if (sceneType === 'warm') {
    sat = clamp(Math.max(sat * 0.90, 0.18), 0.18, 0.52);
    light = bgLum > 0.50 ? 0.26 : 0.74;
  } else if (sceneType === 'neutral') {
    sat = clamp(Math.max(sat * 0.78, 0.10), 0.10, 0.28);
    light = bgLum > 0.50 ? 0.30 : 0.76;
  } else {
    sat = clamp(Math.max(sat * 0.84, 0.12), 0.12, 0.36);
    light = bgLum > 0.50 ? 0.30 : 0.76;
  }

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

function createTextColor(accent, bg, toneMode, softness, sceneType = 'neutral') {
  const bgLum = luminance(bg);
  const accentHsl = rgbToHsl(accent.r, accent.g, accent.b);
  const bgHsl = rgbToHsl(bg.r, bg.g, bg.b);

  let hue = accentHsl.h;
  let sat = accentHsl.s;
  let light = accentHsl.l;

  if (accentHsl.s < 0.08) {
    if (sceneType === 'night-warm' || sceneType === 'warm') hue = 26;
    else if (sceneType === 'night-cool') hue = bgHsl.h >= 190 && bgHsl.h <= 240 ? bgHsl.h : 220;
    else if (sceneType === 'airy-blue') hue = bgHsl.h - 10;
    else hue = bgHsl.h + 15;
  }

  if (bgLum > 0.56) {
    if (sceneType === 'night-cool') {
      sat = clamp(Math.max(sat * 0.56, 0.08), 0.08, 0.20);
      light = 0.32;
    } else if (sceneType === 'night-warm') {
      sat = clamp(Math.max(sat * 0.60, 0.08), 0.08, 0.22);
      light = 0.28;
    } else if (sceneType === 'warm') {
      sat = clamp(Math.max(sat, 0.18), 0.18, 0.52);
      light = 0.24;
    } else if (sceneType === 'airy-blue') {
      sat = clamp(Math.max(sat * 0.72, 0.12), 0.12, 0.36);
      light = 0.34;
    } else if (sceneType === 'neutral') {
      sat = clamp(Math.max(sat * 0.62, 0.08), 0.08, 0.22);
      light = 0.30;
    } else {
      sat = clamp(Math.max(sat * 0.68, 0.10), 0.10, 0.30);
      light = 0.28;
    }
  } else {
    if (sceneType === 'night-cool') {
      sat = clamp(Math.max(sat * 0.52, 0.04), 0.04, 0.18);
      light = 0.88;
    } else if (sceneType === 'night-warm') {
      sat = clamp(Math.max(sat * 0.58, 0.05), 0.05, 0.20);
      light = 0.86;
    } else {
      sat = clamp(Math.max(sat * 0.85, 0.12), 0.12, 0.42);
      light = 0.80;
    }
  }

  let color = hslToRgb(hue, sat, light);

  let mixAmount = 0.08;
  let minRatio = 2.7;

  if (toneMode === 'soft') {
    mixAmount = 0.16;
    minRatio = 2.1;
  } else if (toneMode === 'balanced') {
    mixAmount = 0.06;
    minRatio = 2.9;
  } else if (toneMode === 'vivid') {
    mixAmount = 0;
    minRatio = 3.2;
  }

  color = mix(color, bg, mixAmount);
  return ensureContrast(color, bg, minRatio);
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
  state.sceneType = raw.sceneType || 'neutral';

  const softness = Number(refs.softness.value);
  const autoBg = softenBackground(raw.dominant, softness, state.sceneType);
  const themedBg = applyThemeBias(autoBg, state.theme, softness, state.sceneType);
  const accent = accentFromImage(raw.accent, themedBg, state.sceneType);
  const text = createTextColor(accent, themedBg, refs.toneMode.value, softness, state.sceneType);

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
    if (refs.previewMeta) refs.previewMeta.textContent = `${exportW} × ${exportH}导出｜原图${photoW} × ${photoH}｜${THEMES[state.theme].label}｜${state.sceneType}`;
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
