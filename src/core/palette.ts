import type {
  RgbColor, HslColor, RawPalette, SceneType,
  SceneStats, ColorCandidate, ToneMode, ThemeName,
} from './types';
import {
  clamp, mix, hexToRgb, rgbToHsl, hslToRgb,
  luminance, contrastRatio, hueDistance,
} from './color';

const THEMES: Record<ThemeName, { label: string; tint: string | null; tintStrength: number; hueShift: number; satMul: number; lightAdd: number }> = {
  auto: { label: '自动取色', tint: null, tintStrength: 0, hueShift: 0, satMul: 1, lightAdd: 0 },
  'soft-rose': { label: '柔粉偏移', tint: '#e8d8dc', tintStrength: 0.10, hueShift: 0, satMul: 0.96, lightAdd: 0.01 },
  'mist-blue': { label: '雾蓝偏移', tint: '#d6dde8', tintStrength: 0.12, hueShift: -6, satMul: 0.92, lightAdd: 0 },
  'soft-apricot': { label: '暖杏偏移', tint: '#ecd9c5', tintStrength: 0.12, hueShift: 8, satMul: 0.94, lightAdd: 0.01 },
  'soft-sand': { label: '砂灰偏移', tint: '#e0dbd3', tintStrength: 0.10, hueShift: 2, satMul: 0.82, lightAdd: 0.01 },
};

function quantizeColor(r: number, g: number, b: number): { key: string; hsl: HslColor } {
  const hsl = rgbToHsl(r, g, b);
  return {
    key: `${Math.round(hsl.h / 16)}-${Math.round(hsl.s * 10)}-${Math.round(hsl.l * 10)}`,
    hsl,
  };
}

function pickSceneType(stats: SceneStats): SceneType {
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

function scoreDominantCandidate(candidate: ColorCandidate, sceneType: SceneType): number {
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

function scoreAccentCandidate(candidate: ColorCandidate, dominant: ColorCandidate, sceneType: SceneType): number {
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

export function extractPalette(image: HTMLImageElement): { dominant: RgbColor; accent: RgbColor; sceneType: SceneType } {
  const maxSide = 260;
  const scale = Math.min(maxSide / image.naturalWidth, maxSide / image.naturalHeight, 1);
  const width = Math.max(40, Math.round(image.naturalWidth * scale));
  const height = Math.max(40, Math.round(image.naturalHeight * scale));

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tempCtx) {
    return {
      dominant: { r: 213, g: 219, b: 230 },
      accent: { r: 108, g: 88, b: 72 },
      sceneType: 'neutral',
    };
  }
  tempCtx.drawImage(image, 0, 0, width, height);

  const data = tempCtx.getImageData(0, 0, width, height).data;
  const bins = new Map<string, { r: number; g: number; b: number; count: number; weight: number; h: number; s: number; l: number }>();

  const stats: SceneStats = {
    totalWeight: 0, darkWeight: 0, brightWeight: 0, skyWeight: 0,
    warmWeight: 0, warmLightWeight: 0, neutralWeight: 0, blueWeight: 0, nightBaseWeight: 0,
  };

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 220) continue;

      const r = data[i], g = data[i + 1], b = data[i + 2];
      const { key, hsl } = quantizeColor(r, g, b);
      const { h, s, l } = hsl;

      const isUpper = y < height * 0.58;
      const isCenter = x > width * 0.18 && x < width * 0.82;
      const nearBorder = x < width * 0.10 || x > width * 0.90 || y < height * 0.06 || y > height * 0.94;
      const borderWeight = nearBorder ? 0.18 : 1;
      const regionWeight = (isUpper ? 1.10 : 1) * (isCenter ? 1.10 : 1) * borderWeight;

      let colorWeight = 1;

      if (l < 0.03 || l > 0.96) continue;
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

      const existing = bins.get(key) || { r: 0, g: 0, b: 0, count: 0, weight: 0, h: 0, s: 0, l: 0 };
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

  const candidates: ColorCandidate[] = [...bins.values()]
    .filter((bin) => bin.weight > 0.4)
    .map((bin) => {
      const rgb = {
        r: Math.round(bin.r / bin.weight),
        g: Math.round(bin.g / bin.weight),
        b: Math.round(bin.b / bin.weight),
      };
      const hsl: HslColor = {
        h: bin.h / bin.weight,
        s: bin.s / bin.weight,
        l: bin.l / bin.weight,
      };
      return { ...rgb, hsl, count: bin.count, weight: bin.weight };
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
  if (!dominant) dominant = { r: 213, g: 219, b: 230, hsl: rgbToHsl(213, 219, 230), count: 0, weight: 0 };

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

export function softenBackground(color: RgbColor, softness: number = 60, sceneType: SceneType = 'neutral'): RgbColor {
  const hsl = rgbToHsl(color.r, color.g, color.b);
  const t = clamp(softness / 100, 0, 1);

  let targetS: number, targetL: number;

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

export function applyThemeBias(baseBg: RgbColor, themeName: ThemeName, softness: number = 60, sceneType: SceneType = 'neutral'): RgbColor {
  const theme = THEMES[themeName] || THEMES.auto;
  if (!theme.tint) return baseBg;

  const tint = hexToRgb(theme.tint);
  const mixed = mix(baseBg, tint, theme.tintStrength + softness / 1800);
  const hsl = rgbToHsl(mixed.r, mixed.g, mixed.b);

  let minL: number, maxL: number;
  if (sceneType === 'night-cool') { minL = 0.12; maxL = 0.26; }
  else if (sceneType === 'night-warm') { minL = 0.14; maxL = 0.30; }
  else if (sceneType === 'warm') { minL = 0.42; maxL = 0.74; }
  else if (sceneType === 'neutral') { minL = 0.56; maxL = 0.78; }
  else { minL = 0.50; maxL = 0.78; }

  return hslToRgb(
    hsl.h + theme.hueShift,
    clamp(hsl.s * theme.satMul, 0.08, 0.44),
    clamp(hsl.l + theme.lightAdd, minL, maxL),
  );
}

export function accentFromImage(rawAccent: RgbColor, bg: RgbColor, sceneType: SceneType = 'neutral'): RgbColor {
  const accentHsl = rgbToHsl(rawAccent.r, rawAccent.g, rawAccent.b);
  const bgHsl = rgbToHsl(bg.r, bg.g, bg.b);
  const bgLum = luminance(bg);

  let hue = accentHsl.h;
  let sat = accentHsl.s;
  let light = accentHsl.l;

  if (accentHsl.s < 0.10) {
    if (sceneType === 'night-warm' || sceneType === 'warm') hue = 28;
    else if (sceneType === 'night-cool') hue = bgHsl.h >= 190 && bgHsl.h <= 240 ? bgHsl.h : 220;
    else if (sceneType === 'airy-blue') hue = bgHsl.h >= 180 && bgHsl.h <= 235 ? bgHsl.h - 12 : 215;
    else hue = bgHsl.h + 18;
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

export function ensureContrast(color: RgbColor, bg: RgbColor, ratio: number): RgbColor {
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

export function createTextColor(accent: RgbColor, bg: RgbColor, toneMode: ToneMode, softness: number, sceneType: SceneType = 'neutral'): RgbColor {
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
    if (sceneType === 'night-cool') { sat = clamp(Math.max(sat * 0.56, 0.08), 0.08, 0.20); light = 0.32; }
    else if (sceneType === 'night-warm') { sat = clamp(Math.max(sat * 0.60, 0.08), 0.08, 0.22); light = 0.28; }
    else if (sceneType === 'warm') { sat = clamp(Math.max(sat, 0.18), 0.18, 0.52); light = 0.24; }
    else if (sceneType === 'airy-blue') { sat = clamp(Math.max(sat * 0.72, 0.12), 0.12, 0.36); light = 0.34; }
    else if (sceneType === 'neutral') { sat = clamp(Math.max(sat * 0.62, 0.08), 0.08, 0.22); light = 0.30; }
    else { sat = clamp(Math.max(sat * 0.68, 0.10), 0.10, 0.30); light = 0.28; }
  } else {
    if (sceneType === 'night-cool') { sat = clamp(Math.max(sat * 0.52, 0.04), 0.04, 0.18); light = 0.88; }
    else if (sceneType === 'night-warm') { sat = clamp(Math.max(sat * 0.58, 0.05), 0.05, 0.20); light = 0.86; }
    else { sat = clamp(Math.max(sat * 0.85, 0.12), 0.12, 0.42); light = 0.80; }
  }

  let color = hslToRgb(hue, sat, light);

  let mixAmount = 0.08;
  let minRatio = 2.7;
  if (toneMode === 'soft') { mixAmount = 0.16; minRatio = 2.1; }
  else if (toneMode === 'balanced') { mixAmount = 0.06; minRatio = 2.9; }
  else if (toneMode === 'vivid') { mixAmount = 0; minRatio = 3.2; }

  color = mix(color, bg, mixAmount);
  return ensureContrast(color, bg, minRatio);
}

export function updatePalette(image: HTMLImageElement, themeName: ThemeName, toneMode: ToneMode, softness: number, sceneType: SceneType) {
  const raw = extractPalette(image);
  return rebuildPalette(raw, themeName, toneMode, softness);
}

export function rebuildPalette(raw: { dominant: RgbColor; accent: RgbColor; sceneType: SceneType }, themeName: ThemeName, toneMode: ToneMode, softness: number) {
  const autoBg = softenBackground(raw.dominant, softness, raw.sceneType);
  const themedBg = applyThemeBias(autoBg, themeName, softness, raw.sceneType);
  const accent = accentFromImage(raw.accent, themedBg, raw.sceneType);
  const text = createTextColor(accent, themedBg, toneMode, softness, raw.sceneType);

  return {
    rawPalette: { dominant: raw.dominant, accent: raw.accent } as RawPalette,
    palette: { bg: themedBg, text, accent },
    sceneType: raw.sceneType,
  };
}

export { THEMES };
