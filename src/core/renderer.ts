import type { RgbColor, EdgeMode, EdgeStyle, FrameSettings, RenderTextBlock, SceneType } from './types';
import { getEdgeStyle } from './edge';
import { getFontPreset, applyFontSize } from './fonts';
import { rgbToCss, clamp } from './color';

export function create2DContext(
  canvas: HTMLCanvasElement,
  willReadFrequently: boolean = false,
): CanvasRenderingContext2D | null {
  const candidates: CanvasRenderingContext2DSettings[] = [
    { colorSpace: 'display-p3', willReadFrequently },
    { colorSpace: 'display-p3' },
    { willReadFrequently },
  ];

  for (const options of candidates) {
    try {
      const ctx = canvas.getContext('2d', options);
      if (ctx) return ctx;
    } catch { /* fallback */ }
  }

  return canvas.getContext('2d', { willReadFrequently });
}

export function getFrameSettings(
  whiteBorderPercent: number,
  blackBorderPx: number,
  scale: number,
  contentWidth: number,
  contentHeight: number,
): FrameSettings {
  const base = Math.max(1, Math.min(contentWidth || 1, contentHeight || 1));
  const whiteBorder = Math.round(base * (whiteBorderPercent / 100) * scale);
  const blackBorder = blackBorderPx * scale;

  return { whiteBorderPercent, blackBorderPx, whiteBorder, blackBorder };
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: RgbColor,
  edge: EdgeStyle,
): void {
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

export interface RenderOptions {
  bg: RgbColor;
  text: RgbColor;
  edgeMode: EdgeMode;
  fontFamily: string;
  locationSize: number;
  timeSize: number;
  lineGap: number;
  textY: number;
  whiteBorderPercent: number;
  blackBorderPx: number;
  showLocation: boolean;
  showTime: boolean;
  location: string;
  time: string;
}

export interface RenderResult {
  exportW: number;
  exportH: number;
  contentW: number;
  contentH: number;
  photoW: number;
  photoH: number;
}

export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  options: RenderOptions,
  maxPreviewWidth: number | null = null,
): RenderResult | null {
  if (!image) {
    canvas.width = 960;
    canvas.height = 540;
    ctx.fillStyle = '#eff3f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return null;
  }

  // Support both HTMLImageElement (naturalWidth) and ImageBitmap (width)
  const photoW = (image as HTMLImageElement).naturalWidth || (image as HTMLImageElement).width;
  const photoH = (image as HTMLImageElement).naturalHeight || (image as HTMLImageElement).height;
  const contentW = photoW;
  const contentH = photoH * 2;

  let scale = 1;
  if (maxPreviewWidth) {
    scale = Math.min(maxPreviewWidth / contentW, 1);
  }

  const frame = getFrameSettings(options.whiteBorderPercent, options.blackBorderPx, scale, contentW, contentH);
  const targetContentW = Math.max(1, Math.round(contentW * scale));
  const targetContentH = Math.max(1, Math.round(contentH * scale));
  const targetW = targetContentW + frame.whiteBorder * 2;
  const targetH = targetContentH + frame.whiteBorder * 2;
  const contentX = frame.whiteBorder;
  const contentY = frame.whiteBorder;

  canvas.width = targetW;
  canvas.height = targetH;

  ctx.clearRect(0, 0, targetW, targetH);
  ctx.imageSmoothingEnabled = !!maxPreviewWidth;
  ctx.imageSmoothingQuality = 'high';

  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.fillRect(0, 0, targetW, targetH);

  const { bg, text } = options;
  const topH = Math.round(photoH * scale);
  const bottomY = contentY + topH;
  const drawW = Math.round(photoW * scale);
  const drawH = Math.round(photoH * scale);

  ctx.fillStyle = rgbToCss(bg);
  ctx.fillRect(contentX, contentY, targetContentW, topH);
  ctx.drawImage(image, contentX, bottomY, drawW, drawH);

  const fontPreset = getFontPreset(options.fontFamily);
  const baseLocationSize = clamp(contentW * 0.052, 32, 160) * options.locationSize * scale;
  const baseTimeSize = clamp(baseLocationSize * 0.52, 16, 72) * options.timeSize;
  const lineGap = Math.max(6 * scale, baseTimeSize * 0.36 * options.lineGap * scale);

  const blocks: RenderTextBlock[] = [];
  if (options.showLocation && options.location.trim()) {
    blocks.push({
      text: options.location.trim(),
      font: applyFontSize(fontPreset.location, baseLocationSize),
      size: baseLocationSize,
    });
  }
  if (options.showTime && options.time.trim()) {
    blocks.push({
      text: options.time.trim(),
      font: applyFontSize(fontPreset.time, baseTimeSize),
      size: baseTimeSize,
    });
  }

  if (blocks.length > 0) {
    const totalHeight = blocks.reduce((sum, item) => sum + item.size, 0) + (blocks.length - 1) * lineGap;
    const centerY = contentY + topH * (options.textY / 100);
    let currentY = centerY - totalHeight / 2;
    const edge = getEdgeStyle(text, bg, options.edgeMode);

    for (const item of blocks) {
      currentY += item.size * 0.82;
      drawCenteredText(ctx, item.text, contentX + targetContentW / 2, currentY, item.font, text, edge);
      currentY += item.size * 0.18 + lineGap;
    }
  }

  if (frame.blackBorder > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.lineWidth = frame.blackBorder;
    const inset = frame.blackBorder / 2;
    ctx.strokeRect(
      contentX + inset,
      contentY + inset,
      targetContentW - frame.blackBorder,
      targetContentH - frame.blackBorder,
    );
    ctx.restore();
  }

  return {
    exportW: targetW,
    exportH: targetH,
    contentW,
    contentH,
    photoW,
    photoH,
  };
}
