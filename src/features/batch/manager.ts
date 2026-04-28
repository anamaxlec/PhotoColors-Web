import type { BatchTask } from '@/core/types';
import type { RenderOptions } from '@/core/renderer';

let worker: Worker | null = null;

type ProgressCb = (taskId: string, progress: number) => void;
type DoneCb = (taskId: string, blob: Blob) => void;
type ErrorCb = (taskId: string, error: string) => void;

let currentCallbacks: { onProgress: ProgressCb; onDone: DoneCb; onError: ErrorCb } | null = null;

interface BatchWorkerMessage {
  id: string;
  type: 'progress' | 'done' | 'error';
  progress?: number;
  blob?: Blob;
  error?: string;
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../batch/worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<BatchWorkerMessage>) => {
      if (!currentCallbacks) return;
      const { id, type, progress, blob, error } = e.data;
      if (type === 'progress') {
        currentCallbacks.onProgress(id, progress || 0);
      } else if (type === 'done' && blob) {
        currentCallbacks.onDone(id, blob);
      } else if (type === 'error') {
        currentCallbacks.onError(id, error || 'Unknown error');
      }
    };
    worker.onerror = (err) => {
      console.error('Worker error:', err);
      if (currentCallbacks) {
        currentCallbacks.onError('unknown', 'Worker failed');
      }
    };
  }
  return worker;
}

export function processBatch(
  tasks: BatchTask[],
  renderOptions: RenderOptions,
  onProgress: ProgressCb,
  onDone: DoneCb,
  onError: ErrorCb,
): void {
  const w = getWorker();
  currentCallbacks = { onProgress, onDone, onError };

  for (const task of tasks.filter((t) => t.status === 'pending')) {
    task.status = 'processing';
    w.postMessage({ id: task.id, file: task.file, renderOptions });
  }
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  currentCallbacks = null;
}

export async function exportAsZip(blobs: { name: string; blob: Blob }[]): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const { saveAs } = await import('file-saver');

  const zip = new JSZip();
  for (const { name, blob } of blobs) {
    zip.file(name, blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, 'photocolors-batch.zip');
}
