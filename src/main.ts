import { createApp } from 'petite-vue';
import { createStore } from './ui/store';

const store = createStore();

// Mount Petite-Vue on the sidebar
const app = createApp(store);
app.mount('#app');

// Close export dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (store.showExportMenu) {
    const target = e.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      store.showExportMenu = false;
    }
  }
});
(window as unknown as Record<string, unknown>).store = store;

// ── Toast notification system ──
type ToastType = 'success' | 'error' | 'info';
const TOAST_ICONS: Record<ToastType, string> = {
  success: '<svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M6 9.2l2 2 4-4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  error: '<svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  info: '<svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M9 8v4M9 6v1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};

export function showToast(message: string, type: ToastType = 'info', durationMs = 2500): void {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type]}</span>
    <span>${message}</span>
    <button class="toast-close" aria-label="关闭通知">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close') as HTMLButtonElement;
  const remove = () => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 220);
  };

  closeBtn.addEventListener('click', remove);

  if (durationMs > 0) {
    setTimeout(remove, durationMs);
  }

  container.appendChild(toast);
}

// Expose toast on window for store access
(window as unknown as Record<string, unknown>).showToast = showToast;

// ── File upload handling ──
const imageUpload = document.getElementById('imageUpload') as HTMLInputElement | null;
imageUpload?.addEventListener('change', (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      showToast('不支持的文件格式，请选择图片文件', 'error');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      showToast('文件过大（超过100MB），请选择较小的图片', 'error');
      return;
    }
    showSkeleton(true);
    store.loadImageFromFile(file);
  }
});

// Batch file input
const batchUpload = document.getElementById('batchUpload') as HTMLInputElement | null;
batchUpload?.addEventListener('change', (event) => {
  const files = (event.target as HTMLInputElement).files;
  if (files && files.length > 0) store.addBatchFiles(files);
});

// Template import input
const templateImport = document.getElementById('templateImport') as HTMLInputElement | null;
templateImport?.addEventListener('change', (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) store.importTemplateFromFile(file);
});

// ── Theme toggle animation ──
let themeAnimTimer: ReturnType<typeof setTimeout> | null = null;
const themeToggle = document.getElementById('themeToggle');
themeToggle?.addEventListener('click', () => {
  const root = document.documentElement;
  const rect = themeToggle.getBoundingClientRect();
  root.style.setProperty('--theme-burst-x', `${rect.left + rect.width / 2}px`);
  root.style.setProperty('--theme-burst-y', `${rect.top + rect.height / 2}px`);

  root.classList.remove('theme-switching');
  void root.offsetWidth;
  root.classList.add('theme-switching');

  clearTimeout(themeAnimTimer ?? undefined);
  themeAnimTimer = setTimeout(() => {
    root.classList.remove('theme-switching');
  }, 520);

  store.toggleTheme();
});

// ── Skeleton loading state ──
function showSkeleton(show: boolean): void {
  const skeleton = document.getElementById('canvasSkeleton');
  if (skeleton) skeleton.style.display = show ? 'block' : 'none';
}

// Expose skeleton control
(window as unknown as Record<string, unknown>).showSkeleton = showSkeleton;

// ── Drop zone ──
const dropZone = document.getElementById('dropZone');
let dragCounter = 0;

dropZone?.addEventListener('dragover', (event) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
});

dropZone?.addEventListener('dragenter', () => {
  dragCounter++;
  if (dragCounter === 1) {
    dropZone.classList.add('drag-over');
  }
});

dropZone?.addEventListener('dragleave', () => {
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    dropZone.classList.remove('drag-over');
  }
});

dropZone?.addEventListener('drop', (event) => {
  event.preventDefault();
  dragCounter = 0;
  dropZone.classList.remove('drag-over');
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('不支持的文件格式，请拖拽图片文件', 'error');
    return;
  }
  showSkeleton(true);
  store.loadImageFromFile(file);
});

// ── Demo photo button ──
const demoBtn = document.getElementById('demoBtn');
demoBtn?.addEventListener('click', async () => {
  showSkeleton(true);
  // Generate a simple demo gradient image
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Draw a scenic gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 360);
  skyGrad.addColorStop(0, '#6aa9ea');
  skyGrad.addColorStop(0.5, '#e8c9a0');
  skyGrad.addColorStop(1, '#8db580');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 800, 360);

  const groundGrad = ctx.createLinearGradient(0, 360, 0, 600);
  groundGrad.addColorStop(0, '#5a8f4a');
  groundGrad.addColorStop(1, '#3d5a30');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 360, 800, 240);

  // Draw a sun
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.arc(580, 140, 60, 0, Math.PI * 2);
  ctx.fill();

  // Draw mountains
  ctx.fillStyle = '#6b8e6b';
  ctx.beginPath();
  ctx.moveTo(0, 380);
  ctx.lineTo(160, 260);
  ctx.lineTo(340, 400);
  ctx.lineTo(520, 290);
  ctx.lineTo(680, 370);
  ctx.lineTo(800, 320);
  ctx.lineTo(800, 400);
  ctx.lineTo(0, 400);
  ctx.fill();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });

  if (blob) {
    const file = new File([blob], 'demo-photo.png', { type: 'image/png' });
    store.loadImageFromFile(file);
  }
});

// ── Initial readout sync ──
store.syncReadouts();
store.syncPreview();
