import { createApp } from 'petite-vue';
import { createStore } from './ui/store';

const store = createStore();

// Mount Petite-Vue on the sidebar
const app = createApp(store);
app.mount('#app');

// File upload handling
const imageUpload = document.getElementById('imageUpload') as HTMLInputElement | null;
imageUpload?.addEventListener('change', (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) store.loadImageFromFile(file);
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

// Theme toggle animation
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

// Drop zone
const dropZone = document.getElementById('dropZone');
dropZone?.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.style.boxShadow = 'inset 0 0 0 2px rgba(26, 115, 232, 0.22)';
});

dropZone?.addEventListener('dragleave', () => {
  dropZone.style.boxShadow = '';
});

dropZone?.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.style.boxShadow = '';
  const file = event.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    store.loadImageFromFile(file);
  }
});

// Initial readout sync
store.syncReadouts();
store.syncPreview();
