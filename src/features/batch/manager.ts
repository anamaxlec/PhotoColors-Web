import type { BatchTask } from '@/core/types';
import type { RenderOptions, RenderResult } from '@/core/renderer';

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../batch/worker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

interface BatchWorkerMessage {
  id: string;
  type: 'progress' | 'done' | 'error';
  progress?: number;
  blob?: Blob;
  error?: string;
}

export function processBatch(
  tasks: BatchTask[],
  renderOptions: RenderOptions,
  onProgress: (taskId: string, progress: number) => void,
  onDone: (taskId: string, blob: Blob) => void,
  onError: (taskId: string, error: string) => void,
): void {
  const w = getWorker();

  w.onmessage = (e: MessageEvent<BatchWorkerMessage>) => {
    const { id, type, progress, blob, error } = e.data;
    if (type === 'progress') {
      onProgress(id, progress || 0);
    } else if (type === 'done' && blob) {
      onDone(id, blob);
    } else if (type === 'error') {
      onError(id, error || 'Unknown error');
    }
  };

  w.onerror = (err) => {
    console.error('Worker error:', err);
  };

  for (const task of tasks.filter((t) => t.status === 'pending')) {
    w.postMessage({ id: task.id, file: task.file, renderOptions });
  }
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
