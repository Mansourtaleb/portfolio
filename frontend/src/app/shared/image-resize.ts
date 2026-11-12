/** Image redimensionnée dans le navigateur avant envoi (moins de poids, moins de bande passante). */
export interface ResizedImage {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Réduit l'image à {@code maxSize} pixels sur son plus grand côté et l'encode en WebP
 * (PNG si le navigateur ne sait pas encoder le WebP). Les petites images ne sont pas agrandies.
 */
export async function resizeImage(file: File, maxSize = 1600, quality = 0.85): Promise<ResizedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encodage impossible'))), 'image/webp', quality),
  );
  return { blob, width, height };
}
