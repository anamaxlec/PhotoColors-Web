import { renderToCanvas, create2DContext } from '@/core/renderer';
import type { RenderOptions } from '@/core/renderer';

interface WorkerTask {
  id: string;
  file: File;
  renderOptions: RenderOptions;
}

self.onmessage = async (e: MessageEvent<WorkerTask>) => {
  const { id, file, renderOptions } = e.data;

  try {
    const url = URL.createObjectURL(file);
    const image = await loadImage(url);
    URL.revokeObjectURL(url);

    postMessage({ id, type: 'progress', progress: 30 });

    const exportCanvas = new OffscreenCanvas(100, 100);
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create 2D context');

    postMessage({ id, type: 'progress', progress: 50 });

    renderToCanvas(
      ctx as unknown as CanvasRenderingContext2D,
      exportCanvas as unknown as HTMLCanvasElement,
      image as unknown as HTMLImageElement,
      renderOptions,
      null,
    );

    postMessage({ id, type: 'progress', progress: 80 });

    const blob = await exportCanvas.convertToBlob({ type: 'image/png' });

    postMessage({ id, type: 'done', blob });
  } catch (err) {
    postMessage({ id, type: 'error', error: (err as Error).message });
  }
};

function loadImage(src: string): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    fetch(src)
      .then((res) => res.blob())
      .then((blob) => createImageBitmap(blob))
      .then(resolve)
      .catch(reject);
  });
}
