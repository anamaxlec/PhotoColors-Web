import { reactive } from 'petite-vue';
import type {
  RgbColor, ThemeName, ToneMode, EdgeMode, SceneType,
  Template, BatchTask, TemplateSettings,
} from '@/core/types';
import { extractPalette, updatePalette, rebuildPalette, THEMES } from '@/core/palette';
import { renderToCanvas, create2DContext } from '@/core/renderer';
import { rgbToHex, rgbToCss } from '@/core/color';
import { readExif } from '@/features/exif/reader';
import {
  loadTemplates, addTemplate, deleteTemplate,
  exportTemplate, importTemplate, extractCurrentSettings,
  createTemplate,
} from '@/features/template/manager';
import { processBatch, exportAsZip } from '@/features/batch/manager';
import type { RenderOptions } from '@/core/renderer';
import { BORDER_PRESETS, getBorderPreset } from '@/features/border/presets';
import { ensureFontLoaded } from '@/core/font-loader';

const UI_THEME_KEY = 'photocolors-ui-theme';

function getInitialUiTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem(UI_THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyUiTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-ui-theme', theme);
  localStorage.setItem(UI_THEME_KEY, theme);
}

// Canvas contexts (lazy init)
let previewCtx: CanvasRenderingContext2D | null = null;
let exportCtx: CanvasRenderingContext2D | null = null;
let previewCanvas: HTMLCanvasElement | null = null;
let exportCanvas: HTMLCanvasElement | null = null;

// P0-3: Palette cache — re-extract only when image changes
let cachedRawPalette: { dominant: RgbColor; accent: RgbColor; sceneType: SceneType } | null = null;
let paletteImageSrc: string | null = null;

// P0-1: rAF debounce — merge rapid slider updates into one frame
let rafId: number | null = null;

function initCanvas(): void {
  previewCanvas = document.getElementById('previewCanvas') as HTMLCanvasElement;
  if (!previewCanvas) return;

  previewCtx = create2DContext(previewCanvas, false);
  exportCanvas = document.createElement('canvas');
  exportCtx = create2DContext(exportCanvas, false);
}

function getRenderOptions(s: AppStore): RenderOptions {
  return {
    bg: s.palette.bg,
    text: s.palette.text,
    edgeMode: s.edgeMode,
    fontFamily: s.fontFamily,
    locationSize: s.locationSize,
    timeSize: s.timeSize,
    lineGap: s.lineGap,
    textY: s.textY,
    whiteBorderPercent: s.whiteBorder,
    blackBorderPx: s.blackBorder,
    showLocation: s.showLocation,
    showTime: s.showTime,
    location: s.location,
    time: s.time,
  };
}

export interface AppStore {
  // --- UI ---
  uiTheme: 'light' | 'dark';
  // --- Image ---
  image: HTMLImageElement | null;
  originalFile: File | null;
  imageName: string;
  imageError: string;
  // --- Palette ---
  sceneType: SceneType;
  palette: { bg: RgbColor; text: RgbColor; accent: RgbColor };
  // --- Theme ---
  theme: ThemeName;
  THEMES: typeof THEMES;
  themeNames: ThemeName[];
  themeLabels: Record<ThemeName, string>;
  // --- Controls ---
  location: string;
  time: string;
  showLocation: boolean;
  showTime: boolean;
  fontFamily: string;
  locationSize: number;
  timeSize: number;
  lineGap: number;
  textY: number;
  toneMode: ToneMode;
  edgeMode: EdgeMode;
  softness: number;
  whiteBorder: number;
  blackBorder: number;
  // --- Border presets ---
  borderPreset: string;
  borderPresets: typeof BORDER_PRESETS;
  // --- Derived readouts ---
  exportSize: string;
  exportReady: boolean;
  liveTextPreview: string;
  previewMeta: string;
  bgHex: string;
  textHex: string;
  bgCss: string;
  textCss: string;
  locationSizeValue: string;
  timeSizeValue: string;
  gapValue: string;
  textYValue: string;
  softnessValue: string;
  whiteBorderValue: string;
  blackBorderValue: string;
  // --- Templates ---
  templates: Template[];
  activeTemplateId: string | null;
  showTemplatePanel: boolean;
  newTemplateName: string;
  // --- Batch ---
  batchTasks: BatchTask[];
  batchMode: boolean;
  batchQueueCount: number;
  batchDoneCount: number;
  // --- Core methods ---
  toggleTheme(): void;
  loadImageFromFile(file: File): void;
  handleExport(): void;
  setTheme(themeName: ThemeName): void;
  updateAll(): void;
  scheduleUpdate(): void;
  recolor(): void;
  applyBorderPreset(id: string): void;
  syncReadouts(): void;
  syncPreview(): void;
  syncBatchCounts(): void;
  // --- EXIF ---
  readExifFromFile(): Promise<void>;
  // --- Template methods ---
  saveAsTemplate(name: string): void;
  applyTemplate(tplId: string): void;
  removeTemplate(tplId: string): void;
  exportTemplateById(tplId: string): void;
  importTemplateFromFile(file: File): Promise<void>;
  // --- Batch methods ---
  addBatchFiles(files: FileList): void;
  startBatchProcess(): void;
  exportBatchZip(): void;
  clearBatch(): void;
}

export function createStore(): AppStore {
  const initialTheme = getInitialUiTheme();
  applyUiTheme(initialTheme);

  const defaultBg: RgbColor = { r: 213, g: 219, b: 230 };
  const defaultText: RgbColor = { r: 96, g: 92, b: 83 };
  const defaultAccent: RgbColor = { r: 108, g: 88, b: 72 };

  const themeLabels: Record<ThemeName, string> = {
    auto: '自动取色',
    'soft-rose': '柔粉偏移',
    'mist-blue': '雾蓝偏移',
    'soft-apricot': '暖杏偏移',
    'soft-sand': '砂灰偏移',
  };

  const themeNames: ThemeName[] = ['auto', 'soft-rose', 'mist-blue', 'soft-apricot', 'soft-sand'];

  const store = reactive<AppStore>({
    uiTheme: initialTheme,
    image: null,
    originalFile: null,
    imageName: 'photocolors-output',
    imageError: '',
    sceneType: 'neutral' as SceneType,
    palette: { bg: defaultBg, text: defaultText, accent: defaultAccent },
    theme: 'auto' as ThemeName,
    THEMES,
    themeNames,
    themeLabels,
    location: 'Fuzhou',
    time: '18:00',
    showLocation: true,
    showTime: true,
    fontFamily: 'apple',
    locationSize: 1.0,
    timeSize: 1.0,
    lineGap: 1.0,
    textY: 50,
    toneMode: 'elegant' as ToneMode,
    edgeMode: 'soft' as EdgeMode,
    softness: 60,
    whiteBorder: 8,
    blackBorder: 2,
    borderPreset: 'classic',
    borderPresets: BORDER_PRESETS,
    exportSize: '未加载图片',
    exportReady: false,
    liveTextPreview: '未显示文字',
    previewMeta: '未加载图片',
    bgHex: rgbToHex(defaultBg),
    textHex: rgbToHex(defaultText),
    bgCss: rgbToCss(defaultBg),
    textCss: rgbToCss(defaultText),
    locationSizeValue: '1.00×',
    timeSizeValue: '1.00×',
    gapValue: '1.00×',
    textYValue: '50%',
    softnessValue: '60',
    whiteBorderValue: '8%',
    blackBorderValue: '2px',
    templates: loadTemplates(),
    activeTemplateId: null,
    showTemplatePanel: false,
    newTemplateName: '',
    batchTasks: [],
    batchMode: false,
    batchQueueCount: 0,
    batchDoneCount: 0,

    toggleTheme() {
      const current = document.documentElement.getAttribute('data-ui-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyUiTheme(next);
      this.uiTheme = next;
    },

    loadImageFromFile(file: File) {
      this.imageError = '';
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.originalFile = file;
        this.imageName = file.name.replace(/\.[^/.]+$/, '') || 'photocolors-output';

        // P0-3: Pre-cache palette extraction for this image
        cachedRawPalette = extractPalette(img);
        paletteImageSrc = img.src;

        this.readExifFromFile().then(() => {
          this.updateAll();
        });
        this.updateAll();
      };
      img.onerror = () => {
        this.imageError = '图片加载失败，请检查文件格式';
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },

    async readExifFromFile() {
      if (!this.originalFile) return;
      const exif = await readExif(this.originalFile);
      if (exif.dateTime && !this.time) {
        this.time = exif.dateTime;
      }
    },

    setTheme(themeName: ThemeName) {
      this.theme = themeName;
      cachedRawPalette = null; // P0-3: theme change needs palette recalculation
      this.updateAll();
    },

    recolor() {
      if (!this.image) return;
      cachedRawPalette = null; // P0-3: force re-extraction
      paletteImageSrc = null;
      this.updateAll();
    },

    applyBorderPreset(id: string) {
      this.borderPreset = id;
      const preset = getBorderPreset(id);
      this.whiteBorder = preset.whiteBorderPercent;
      this.blackBorder = preset.blackBorderPx;
      this.updateAll();
    },

    // P0-1: Debounced version for slider inputs — merges rapid changes into one frame
    scheduleUpdate() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        this.updateAll();
      });
    },

    updateAll() {
      this.syncReadouts();
      this.syncPreview();
      if (!this.image) return;

      ensureFontLoaded(this.fontFamily);

      if (!previewCtx) initCanvas();
      if (!previewCtx || !previewCanvas) return;

      // P0-3: Use cached palette when only style params changed
      let rawPal = cachedRawPalette;
      if (!rawPal || paletteImageSrc !== this.image.src) {
        rawPal = extractPalette(this.image);
        paletteImageSrc = this.image.src;
        cachedRawPalette = rawPal;
      }

      const paletteResult = rebuildPalette(rawPal, this.theme, this.toneMode, this.softness);
      this.sceneType = paletteResult.sceneType;
      this.palette = paletteResult.palette;

      this.bgHex = rgbToHex(this.palette.bg);
      this.textHex = rgbToHex(this.palette.text);
      this.bgCss = rgbToCss(this.palette.bg);
      this.textCss = rgbToCss(this.palette.text);

      const options = getRenderOptions(this);

      // P0-2: Only render preview canvas during editing; export canvas rendered on demand
      const previewResult = renderToCanvas(previewCtx, previewCanvas, this.image, options, 1080);

      if (previewResult) {
        this.exportSize = `${previewResult.exportW} × ${previewResult.exportH}`;
        this.previewMeta = `${previewResult.exportW} × ${previewResult.exportH}导出｜内容区${previewResult.contentW} × ${previewResult.contentH}｜原图${previewResult.photoW} × ${previewResult.photoH}｜${(themeLabels as Record<string, string>)[this.theme as string]}｜${this.sceneType}`;
        this.exportReady = true;
      }

      const placeholder = document.getElementById('placeholder');
      placeholder?.classList.add('is-hidden');
    },

    syncReadouts() {
      this.locationSizeValue = `${this.locationSize.toFixed(2)}×`;
      this.timeSizeValue = `${this.timeSize.toFixed(2)}×`;
      this.gapValue = `${this.lineGap.toFixed(2)}×`;
      this.textYValue = `${this.textY}%`;
      this.softnessValue = `${this.softness}`;
      this.whiteBorderValue = `${this.whiteBorder.toFixed(1).replace(/\.0$/, '')}%`;
      this.blackBorderValue = `${this.blackBorder.toFixed(1).replace(/\.0$/, '')}px`;
    },

    syncPreview() {
      const parts: string[] = [];
      if (this.showLocation && this.location.trim()) parts.push(this.location.trim());
      if (this.showTime && this.time.trim()) parts.push(this.time.trim());
      this.liveTextPreview = parts.join(' / ') || '未显示文字';
    },

    handleExport() {
      if (!this.image || !exportCanvas || !exportCtx) return;

      // P0-2: Render export canvas on demand only when user clicks export
      const options = getRenderOptions(this);
      const exportResult = renderToCanvas(exportCtx, exportCanvas, this.image, options, null);
      if (!exportResult) return;

      exportCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${this.imageName}-photocolors.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }, 'image/png');
    },

    // Template methods
    saveAsTemplate(name: string) {
      const settings = extractCurrentSettings(
        this.theme, this.toneMode, this.edgeMode, this.softness,
        this.fontFamily, this.locationSize, this.timeSize,
        this.lineGap, this.textY, this.whiteBorder, this.blackBorder,
        this.borderPreset, this.showLocation, this.showTime,
      );
      const tpl = createTemplate(name, settings);
      this.templates = addTemplate(this.templates, tpl);
      this.showTemplatePanel = false;
    },

    applyTemplate(tplId: string) {
      const tpl = this.templates.find((t: Template) => t.id === tplId);
      if (!tpl) return;
      const s = tpl.settings;
      this.theme = s.theme;
      this.toneMode = s.toneMode;
      this.edgeMode = s.edgeMode;
      this.softness = s.softness;
      this.fontFamily = s.fontFamily;
      this.locationSize = s.locationSize;
      this.timeSize = s.timeSize;
      this.lineGap = s.lineGap;
      this.textY = s.textY;
      this.whiteBorder = s.whiteBorder;
      this.blackBorder = s.blackBorder;
      this.borderPreset = s.borderPreset;
      this.showLocation = s.showLocation;
      this.showTime = s.showTime;
      this.activeTemplateId = tplId;
      cachedRawPalette = null; // P0-3: theme/tone/softness changed
      this.updateAll();
    },

    removeTemplate(tplId: string) {
      this.templates = deleteTemplate(this.templates, tplId);
      if (this.activeTemplateId === tplId) this.activeTemplateId = null;
    },

    exportTemplateById(tplId: string) {
      const tpl = this.templates.find((t: Template) => t.id === tplId);
      if (!tpl) return;
      exportTemplate(tpl);
    },

    async importTemplateFromFile(file: File) {
      try {
        const tpl = await importTemplate(file);
        this.templates = addTemplate(this.templates, tpl);
      } catch (e) {
        alert('导入失败：无效的模板文件');
      }
    },

    // Batch methods
    addBatchFiles(files: FileList) {
      const tasks: BatchTask[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        tasks.push({
          id: `batch-${Date.now()}-${i}`,
          file,
          status: 'pending' as const,
          progress: 0,
          thumbnail: '',
          filename: file.name,
        });
      }
      this.batchTasks = [...this.batchTasks, ...tasks];
      this.batchMode = true;
      this.syncBatchCounts();
    },

    startBatchProcess() {
      const pending = this.batchTasks.filter((t: BatchTask) => t.status === 'pending');
      if (pending.length === 0 || !this.image) return;

      const options = getRenderOptions(this);

      for (const task of pending) {
        task.status = 'processing';
      }

      const completedBlobs: Map<string, Blob> = new Map();

      processBatch(
        this.batchTasks,
        options,
        (taskId, progress) => {
          const task = this.batchTasks.find((t: BatchTask) => t.id === taskId);
          if (task) task.progress = progress;
        },
        (taskId, blob) => {
          const task = this.batchTasks.find((t: BatchTask) => t.id === taskId);
          if (task) {
            task.status = 'done';
            task.progress = 100;
            completedBlobs.set(taskId, blob);
          }
          this.syncBatchCounts();
          // Auto-export ZIP when all tasks are done
          const allDone = this.batchTasks.every((t: BatchTask) => t.status === 'done' || t.status === 'error');
          if (allDone && completedBlobs.size > 0) {
            const blobs: { name: string; blob: Blob }[] = [];
            for (const task of this.batchTasks) {
              const b = completedBlobs.get(task.id);
              if (b) {
                blobs.push({
                  name: task.filename.replace(/\.[^/.]+$/, '') + '-photocolors.png',
                  blob: b,
                });
              }
            }
            exportAsZip(blobs);
          }
        },
        (taskId) => {
          const task = this.batchTasks.find((t: BatchTask) => t.id === taskId);
          if (task) {
            task.status = 'error';
            task.progress = 0;
          }
          this.syncBatchCounts();
          // Still export partial if some succeeded
          const allDone = this.batchTasks.every((t: BatchTask) => t.status === 'done' || t.status === 'error');
          if (allDone && completedBlobs.size > 0) {
            const blobs: { name: string; blob: Blob }[] = [];
            for (const task of this.batchTasks) {
              const b = completedBlobs.get(task.id);
              if (b) {
                blobs.push({
                  name: task.filename.replace(/\.[^/.]+$/, '') + '-photocolors.png',
                  blob: b,
                });
              }
            }
            exportAsZip(blobs);
          }
        },
      );
    },

    async exportBatchZip() {
      alert('批量任务完成后会自动导出 ZIP 文件');
    },

    clearBatch() {
      this.batchTasks = [];
      this.batchMode = false;
      this.batchDoneCount = 0;
      this.batchQueueCount = 0;
    },

    syncBatchCounts() {
      this.batchQueueCount = this.batchTasks.filter((t: BatchTask) => t.status === 'pending' || t.status === 'processing').length;
      this.batchDoneCount = this.batchTasks.filter((t: BatchTask) => t.status === 'done').length;
    },
  });

  return store;
}
