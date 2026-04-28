import type { BorderPreset } from '@/core/types';

export const BORDER_PRESETS: BorderPreset[] = [
  {
    id: 'none',
    label: '无边框',
    whiteBorderPercent: 0,
    blackBorderPx: 0,
    borderRadius: 0,
    shadow: 'none',
    shadowEnabled: false,
  },
  {
    id: 'minimal',
    label: '极简',
    whiteBorderPercent: 0,
    blackBorderPx: 1,
    borderRadius: 0,
    shadow: 'none',
    shadowEnabled: false,
  },
  {
    id: 'classic',
    label: '经典',
    whiteBorderPercent: 8,
    blackBorderPx: 2,
    borderRadius: 0,
    shadow: 'none',
    shadowEnabled: false,
  },
  {
    id: 'polaroid',
    label: '拍立得',
    whiteBorderPercent: 10,
    blackBorderPx: 0,
    borderRadius: 0,
    shadow: '0 4px 16px rgba(0,0,0,0.12)',
    shadowEnabled: true,
  },
  {
    id: 'film',
    label: '胶片',
    whiteBorderPercent: 5,
    blackBorderPx: 3,
    borderRadius: 0,
    shadow: 'none',
    shadowEnabled: false,
  },
  {
    id: 'shadow',
    label: '投影',
    whiteBorderPercent: 4,
    blackBorderPx: 0,
    borderRadius: 0,
    shadow: '0 8px 32px rgba(0,0,0,0.15)',
    shadowEnabled: true,
  },
];

export function getBorderPreset(id: string): BorderPreset {
  return BORDER_PRESETS.find((p) => p.id === id) || BORDER_PRESETS[2];
}
