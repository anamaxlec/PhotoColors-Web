import type { FontPreset } from './types';

export const FONT_STACKS: Record<string, FontPreset> = {
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

export function getFontPreset(name: string): FontPreset {
  return FONT_STACKS[name] || FONT_STACKS.apple;
}

export function applyFontSize(template: string, sizePx: number): string {
  return template.replace('1px', `${sizePx.toFixed(2)}px`);
}
