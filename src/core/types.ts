export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export interface RawPalette {
  dominant: RgbColor;
  accent: RgbColor;
}

export interface Palette {
  bg: RgbColor;
  text: RgbColor;
  accent: RgbColor;
}

export type SceneType = 'neutral' | 'night-cool' | 'night-warm' | 'airy-blue' | 'warm' | 'soft-natural';
export type ToneMode = 'soft' | 'elegant' | 'balanced' | 'vivid';
export type EdgeMode = 'none' | 'soft' | 'mist';
export type ThemeName = 'auto' | 'soft-rose' | 'mist-blue' | 'soft-apricot' | 'soft-sand';

export interface ThemeConfig {
  label: string;
  tint: string | null;
  tintStrength: number;
  hueShift: number;
  satMul: number;
  lightAdd: number;
}

export interface FontPreset {
  location: string;
  time: string;
}

export interface EdgeStyle {
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetY: number;
}

export interface BorderPreset {
  id: string;
  label: string;
  whiteBorderPercent: number;
  blackBorderPx: number;
  borderRadius: number;
  shadow: string;
  shadowEnabled: boolean;
}

export interface ExifData {
  dateTime?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: number;
  focalLength?: string;
}

export interface Template {
  id: string;
  name: string;
  created: string;
  settings: TemplateSettings;
}

export interface TemplateSettings {
  theme: ThemeName;
  toneMode: ToneMode;
  edgeMode: EdgeMode;
  softness: number;
  fontFamily: string;
  locationSize: number;
  timeSize: number;
  lineGap: number;
  textY: number;
  whiteBorder: number;
  blackBorder: number;
  borderPreset: string;
  showLocation: boolean;
  showTime: boolean;
}

export interface BatchTask {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  thumbnail: string;
  filename: string;
}

export interface SceneStats {
  totalWeight: number;
  darkWeight: number;
  brightWeight: number;
  skyWeight: number;
  warmWeight: number;
  warmLightWeight: number;
  neutralWeight: number;
  blueWeight: number;
  nightBaseWeight: number;
}

export interface ColorCandidate {
  r: number;
  g: number;
  b: number;
  hsl: HslColor;
  count: number;
  weight: number;
}

export interface FrameSettings {
  whiteBorderPercent: number;
  blackBorderPx: number;
  whiteBorder: number;
  blackBorder: number;
}

export interface RenderTextBlock {
  text: string;
  font: string;
  size: number;
}
