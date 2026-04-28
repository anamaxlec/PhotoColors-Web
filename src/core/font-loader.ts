const FONT_FAMILIES: Record<string, string> = {
  inter: 'Inter',
  jakarta: 'Plus Jakarta Sans',
  manrope: 'Manrope',
  outfit: 'Outfit',
  montserrat: 'Montserrat',
  nunito: 'Nunito Sans',
  ibm: 'IBM Plex Sans',
};

const loadedFonts = new Set<string>();

export function ensureFontLoaded(fontKey: string): void {
  const family = FONT_FAMILIES[fontKey];
  if (!family || loadedFonts.has(fontKey)) return;
  loadedFonts.add(fontKey);

  const weights = [400, 500, 600, 700];
  for (const w of weights) {
    document.fonts.load(`${w} 16px "${family}"`).catch(() => {});
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}