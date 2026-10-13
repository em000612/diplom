import * as THREE from 'three';
import { PackageType, ProductSKU } from '../types';

/**
 * Procedural label canvas generator for photorealistic 3D packages
 */
export function createProceduralLabelTexture(sku: ProductSKU): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const { brand, name, volumeText, barcode, promoBadge, materialProps, packageType } = sku;
  const primaryColor = materialProps.color || '#2563eb';

  // Base background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1024, 1024);

  // Background design / gradient accent
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, primaryColor);
  grad.addColorStop(0.4, adjustColor(primaryColor, -20));
  grad.addColorStop(0.42, '#f8fafc');
  grad.addColorStop(1, '#ffffff');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Ornamental border/accents
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 8;
  ctx.strokeRect(32, 32, 960, 960);

  // Top header: Brand Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '4px';
  ctx.fillText(brand.toUpperCase(), 512, 130);

  // Subtitle / category banner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '600 24px "Inter", sans-serif';
  ctx.fillText('★ ВЫСШИЙ СТАНДАРТ КАЧЕСТВА ★', 512, 200);

  // Promo badge if present
  if (promoBadge) {
    ctx.save();
    ctx.translate(850, 120);
    ctx.rotate(0.15);
    ctx.fillStyle = '#dc2626';
    roundRect(ctx, -100, -30, 200, 60, 16);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(promoBadge, 0, 6);
    ctx.restore();
  }

  // Circular or shield hero emblem
  ctx.save();
  ctx.beginPath();
  ctx.arc(512, 380, 130, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = primaryColor;
  ctx.stroke();

  // Emblem icon or graphic
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(getEmblemLetter(packageType, brand), 512, 395);
  ctx.restore();

  // Product Name (wrapped if long)
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 46px "Inter", sans-serif';
  ctx.textAlign = 'center';

  const words = name.split(' ');
  let line = '';
  let y = 600;
  const lineHeight = 54;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 820 && n > 0) {
      ctx.fillText(line.trim(), 512, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), 512, y);

  // Volume / Net weight tag
  ctx.fillStyle = primaryColor;
  roundRect(ctx, 412, y + 50, 200, 50, 25);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(volumeText || '250 г', 512, y + 84);

  // Bottom area: Barcode and nutritional badges
  const bottomY = 880;
  drawBarcode(ctx, barcode || '4607001928312', 120, bottomY, 260, 80);

  // Quality marks
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ГОСТ Р ИСО 22000', 920, bottomY + 25);
  ctx.fillText('БЕЗ ГМО & КОНСЕРВАНТОВ', 920, bottomY + 55);
  ctx.fillText('100% НАТУРАЛЬНО', 920, bottomY + 85);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Loads an image from data URL into a Three.js Texture
 */
export function loadTextureFromDataUrl(dataUrl: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      dataUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

/**
 * Client-side automatic background remover (removes white/neutral background with smooth alpha feathering)
 */
export async function removeImageBackground(imageSrc: string, tolerance: number = 28): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample 4 corners to detect dominant background color
      const corners = [
        [0, 0],
        [canvas.width - 1, 0],
        [0, canvas.height - 1],
        [canvas.width - 1, canvas.height - 1],
      ];

      let bgR = 0,
        bgG = 0,
        bgB = 0;
      for (const [cx, cy] of corners) {
        const idx = (cy * canvas.width + cx) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      }
      bgR /= corners.length;
      bgG /= corners.length;
      bgB /= corners.length;

      // Color distance & alpha fade
      const threshold = tolerance * 2.5;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

        if (dist < threshold) {
          // Feathered alpha
          const alphaFactor = Math.max(0, (dist - threshold * 0.5) / (threshold * 0.5));
          data[i + 3] = Math.round(data[i + 3] * alphaFactor);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

function drawBarcode(
  ctx: CanvasRenderingContext2D,
  code: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.fillStyle = '#0f172a';
  const barWidth = width / (code.length * 6);
  let curX = x;

  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i], 10) || 5;
    for (let j = 0; j < 4; j++) {
      if ((digit + j) % 2 === 0) {
        ctx.fillRect(curX, y, barWidth * 1.5, height - 20);
      }
      curX += barWidth * 1.5;
    }
  }

  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(code, x + width / 2, y + height);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function getEmblemLetter(type: PackageType, brand: string): string {
  if (brand && brand.length > 0) return brand[0].toUpperCase();
  switch (type) {
    case 'glass_jar':
      return '🌿';
    case 'dough_roll':
      return '🥐';
    case 'dumpling_bag':
      return '🥟';
    case 'doypack':
      return '✨';
    default:
      return '✦';
  }
}

function adjustColor(color: string, amount: number): string {
  return '#' + color.replace(/^#/, '').replace(/../g, (colorPart) =>
    ('0' + Math.min(255, Math.max(0, parseInt(colorPart, 16) + amount)).toString(16)).substr(-2)
  );
}
