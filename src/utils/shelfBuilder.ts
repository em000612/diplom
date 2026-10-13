import * as THREE from 'three';
import { SHELF_TIERS } from './constants';
import { ProductSKU } from '../types';

export interface ShelfSceneOptions {
  shelfWidth?: number; // meters (e.g. 2.4m)
  shelfDepth?: number; // meters (e.g. 0.55m)
  shelfColor?: string; // '#1e293b' (anthracite) or '#f8fafc'
  showPriceTags?: boolean;
}

/**
 * Builds the supermarket gondola shelving rack
 */
export function buildSupermarketGondola(options: ShelfSceneOptions = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'supermarket_gondola';

  const width = options.shelfWidth || 2.4;
  const depth = options.shelfDepth || 0.55;
  const color = options.shelfColor || '#1e293b';

  // Gondola metal material (powder-coated metal)
  const metalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.35,
    metalness: 0.7,
    envMapIntensity: 0.8,
  });

  // Price rail acrylic material
  const priceRailMat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.1,
    transmission: 0.85,
    transparent: true,
    opacity: 0.9,
    clearcoat: 1.0,
  });

  // Back wall panel of the gondola
  const backPanelHeight = 2.4;
  const backGeo = new THREE.BoxGeometry(width + 0.1, backPanelHeight, 0.04);
  const backMesh = new THREE.Mesh(backGeo, metalMat);
  backMesh.position.set(0, 0.2, -depth / 2 - 0.02);
  backMesh.receiveShadow = true;
  group.add(backMesh);

  // Perforated slot lines on back panel
  const slotCount = 12;
  const slotMat = new THREE.MeshBasicMaterial({ color: '#090d16' });
  for (let i = 0; i < slotCount; i++) {
    const slotX = -width / 2 + (width / (slotCount - 1)) * i;
    const slotGeo = new THREE.BoxGeometry(0.015, backPanelHeight * 0.9, 0.002);
    const slotMesh = new THREE.Mesh(slotGeo, slotMat);
    slotMesh.position.set(slotX, 0.2, -depth / 2 + 0.001);
    group.add(slotMesh);
  }

  // Side upright posts (стойки стеллажа)
  const postGeo = new THREE.BoxGeometry(0.06, backPanelHeight + 0.2, depth + 0.08);
  const leftPost = new THREE.Mesh(postGeo, metalMat);
  leftPost.position.set(-width / 2 - 0.03, 0.2, 0);
  leftPost.castShadow = true;
  leftPost.receiveShadow = true;
  group.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, metalMat);
  rightPost.position.set(width / 2 + 0.03, 0.2, 0);
  rightPost.castShadow = true;
  rightPost.receiveShadow = true;
  group.add(rightPost);

  // Gondola base plinth (цоколь стеллажа)
  const baseGeo = new THREE.BoxGeometry(width + 0.1, 0.15, depth + 0.05);
  const baseMesh = new THREE.Mesh(baseGeo, metalMat);
  baseMesh.position.set(0, -1.0, 0);
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Shelves for each tier
  SHELF_TIERS.forEach((tier) => {
    const shelfGroup = new THREE.Group();
    shelfGroup.name = `shelf_tier_${tier.id}`;

    // Main steel shelf plate
    const shelfGeo = new THREE.BoxGeometry(width, 0.03, depth);
    const shelfMesh = new THREE.Mesh(shelfGeo, metalMat);
    shelfMesh.position.set(0, 0, 0);
    shelfMesh.receiveShadow = true;
    shelfMesh.castShadow = true;
    shelfGroup.add(shelfMesh);

    // Front price rail channel (ценникодержатель)
    const railGeo = new THREE.BoxGeometry(width, 0.045, 0.01);
    const railMesh = new THREE.Mesh(railGeo, priceRailMat);
    railMesh.position.set(0, -0.015, depth / 2 + 0.006);
    shelfGroup.add(railMesh);

    // Golden shelf indicator (subtle glowing trim for Golden Shelf)
    if (tier.isGolden) {
      const goldTrimGeo = new THREE.BoxGeometry(width, 0.005, 0.012);
      const goldTrimMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
      const goldTrim = new THREE.Mesh(goldTrimGeo, goldTrimMat);
      goldTrim.position.set(0, 0.016, depth / 2 + 0.006);
      shelfGroup.add(goldTrim);
    }

    // Shelf support brackets (кронштейны)
    const bracketGeo = new THREE.BoxGeometry(0.03, 0.08, depth * 0.9);
    const leftBracket = new THREE.Mesh(bracketGeo, metalMat);
    leftBracket.position.set(-width / 2 + 0.05, -0.04, 0);
    shelfGroup.add(leftBracket);

    const rightBracket = new THREE.Mesh(bracketGeo, metalMat);
    rightBracket.position.set(width / 2 - 0.05, -0.04, 0);
    shelfGroup.add(rightBracket);

    // Position shelf at tier y-level
    shelfGroup.position.set(0, tier.yPosition, 0);
    group.add(shelfGroup);
  });

  // Store floor plane
  const floorGeo = new THREE.PlaneGeometry(12, 12);
  const floorMat = new THREE.MeshStandardMaterial({
    color: '#0b0f19',
    roughness: 0.15,
    metalness: 0.2,
    envMapIntensity: 0.5,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -1.1;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Store aisle background billboard / lighting ambience
  const storeBackGeo = new THREE.PlaneGeometry(12, 6);
  const storeBackMat = new THREE.MeshBasicMaterial({
    color: '#060911',
  });
  const storeBack = new THREE.Mesh(storeBackGeo, storeBackMat);
  storeBack.position.set(0, 1.5, -4);
  group.add(storeBack);

  return group;
}

/**
 * Creates an electronic or paper price tag 3D mesh (ценник) for a product
 */
export function createPriceTagMesh(sku: ProductSKU, shelfDepth: number = 0.55): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Price tag background: modern electronic ESL (electronic shelf label) look
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 256);

    // Top bar with brand
    ctx.fillStyle = sku.isCompetitor ? '#334155' : '#1e3a8a';
    ctx.fillRect(0, 0, 512, 55);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText((sku.brand || 'БРЕНД').toUpperCase(), 24, 38);

    ctx.textAlign = 'right';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(sku.volumeText || '', 488, 38);

    // Product name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    const cleanName = sku.name.length > 28 ? sku.name.slice(0, 26) + '...' : sku.name;
    ctx.fillText(cleanName, 24, 98);

    // Big Price
    ctx.fillStyle = sku.promoBadge ? '#dc2626' : '#0f172a';
    ctx.font = 'bold 68px "Inter", sans-serif';
    ctx.fillText(`${sku.price}`, 24, 185);

    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(sku.currency || '₽', 24 + ctx.measureText(`${sku.price}`).width + 12, 160);

    // Promo badge tag
    if (sku.promoBadge) {
      ctx.fillStyle = '#dc2626';
      roundRect(ctx, 310, 120, 180, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sku.promoBadge, 400, 152);
    }

    // Barcode line at bottom
    ctx.fillStyle = '#64748b';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`АРТ: ${sku.barcode || '4607001928312'}`, 24, 230);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const tagGeo = new THREE.PlaneGeometry(0.12, 0.055);
  const tagMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  const tagMesh = new THREE.Mesh(tagGeo, tagMat);
  tagMesh.name = `pricetag_${sku.id}`;
  // Tilt slightly upwards towards customer eye level
  tagMesh.rotation.x = -0.15;
  tagMesh.position.set(0, -0.015, shelfDepth / 2 + 0.015);
  return tagMesh;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
