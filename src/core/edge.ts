import type { RgbColor, EdgeMode, EdgeStyle } from './types';
import { mix } from './color';

export function getEdgeStyle(textColor: RgbColor, bg: RgbColor, edgeMode: EdgeMode): EdgeStyle {
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
