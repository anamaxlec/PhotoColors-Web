import type { ExifData } from '@/core/types';

export async function readExif(file: File): Promise<ExifData> {
  const result: ExifData = {};

  try {
    const { parse } = await import('exifr');
    const exif = await parse(file, [
      'DateTimeOriginal',
      'ExposureTime',
      'FNumber',
      'ISO',
      'FocalLength',
    ]);

    if (!exif) return result;

    if (exif.DateTimeOriginal) {
      const match = exif.DateTimeOriginal.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        result.dateTime = `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
      }
    }

    if (exif.ExposureTime) {
      const num = exif.ExposureTime;
      result.exposureTime = num >= 1 ? `${num}s` : `1/${Math.round(1 / num)}s`;
    }

    if (exif.FNumber) {
      result.fNumber = `f/${exif.FNumber.toFixed(1)}`;
    }

    if (exif.ISO !== undefined && exif.ISO !== null) {
      result.iso = exif.ISO;
    }

    if (exif.FocalLength) {
      result.focalLength = `${Math.round(exif.FocalLength)}mm`;
    }
  } catch {
    // EXIF reading failed silently
  }

  return result;
}
