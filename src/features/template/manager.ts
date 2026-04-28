import type { Template, TemplateSettings } from '@/core/types';
import type { ThemeName, ToneMode, EdgeMode } from '@/core/types';

const STORAGE_KEY = 'photocolors-templates';

export function loadTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Template[];
  } catch {
    return [];
  }
}

function saveTemplates(templates: Template[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function createTemplate(name: string, settings: TemplateSettings): Template {
  return {
    id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    created: new Date().toISOString(),
    settings: { ...settings },
  };
}

export function addTemplate(templates: Template[], template: Template): Template[] {
  const updated = [...templates, template];
  saveTemplates(updated);
  return updated;
}

export function deleteTemplate(templates: Template[], id: string): Template[] {
  const updated = templates.filter((t) => t.id !== id);
  saveTemplates(updated);
  return updated;
}

export function exportTemplate(template: Template): void {
  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.name.replace(/\s+/g, '-')}.photocolors.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importTemplate(file: File): Promise<Template> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const template = JSON.parse(reader.result as string) as Template;
        if (!template.id || !template.name || !template.settings) {
          throw new Error('Invalid template format');
        }
        resolve(template);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function extractCurrentSettings(
  themeName: ThemeName,
  toneMode: ToneMode,
  edgeMode: EdgeMode,
  softness: number,
  fontFamily: string,
  locationSize: number,
  timeSize: number,
  lineGap: number,
  textY: number,
  whiteBorder: number,
  blackBorder: number,
  borderPreset: string,
  showLocation: boolean,
  showTime: boolean,
): TemplateSettings {
  return {
    theme: themeName,
    toneMode,
    edgeMode,
    softness,
    fontFamily,
    locationSize,
    timeSize,
    lineGap,
    textY,
    whiteBorder,
    blackBorder,
    borderPreset,
    showLocation,
    showTime,
  };
}
