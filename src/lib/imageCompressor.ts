/**
 * MG Solar Inventory — Mobile & Web Image Compressor
 * Converts any captured or uploaded image into an optimized WebP format with a strict size limit (<= 20KB max).
 */

export function getBase64SizeBytes(base64: string): number {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  return Math.round((base64Data.length * 3) / 4);
}

export async function compressImageToWebP(
  source: File | string,
  maxSizeBytes: number = 20 * 1024 // 20KB limit
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const process = () => {
      let width = img.width;
      let height = img.height;

      // Initial max resolution boundary: 600px width/height ensures crisp visual detail while remaining light
      let maxDimension = 600;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(10, width);
      canvas.height = Math.max(10, height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      // Draw image onto canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Attempt 1: WebP compression starting at quality 0.70
      let quality = 0.70;
      let dataUrl = canvas.toDataURL('image/webp', quality);

      // Step 1: Reduce quality iteratively down to 0.10 if size exceeds maxSizeBytes
      while (getBase64SizeBytes(dataUrl) > maxSizeBytes && quality > 0.10) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL('image/webp', Math.max(0.05, quality));
      }

      // Step 2: If still exceeds maxSizeBytes (e.g. extremely dense image), scale down canvas dimensions iteratively
      if (getBase64SizeBytes(dataUrl) > maxSizeBytes) {
        let scale = 0.8;
        while (getBase64SizeBytes(dataUrl) > maxSizeBytes && scale >= 0.15) {
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = Math.max(50, Math.round(width * scale));
          scaledCanvas.height = Math.max(50, Math.round(height * scale));
          const scaledCtx = scaledCanvas.getContext('2d');
          if (scaledCtx) {
            scaledCtx.drawImage(img, 0, 0, scaledCanvas.width, scaledCanvas.height);
            dataUrl = scaledCanvas.toDataURL('image/webp', Math.min(quality, 0.45));
          }
          scale -= 0.15;
        }
      }

      resolve(dataUrl);
    };

    img.onload = () => {
      try {
        process();
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(err);

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}
