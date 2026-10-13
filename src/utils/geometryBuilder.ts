import * as THREE from 'three';
import { ProductSKU } from '../types';
import { createProceduralLabelTexture, loadTextureFromDataUrl } from './textureGenerator';

/**
 * Procedural 3D Mesh Generator for all 11 Packaging Types
 */
export async function buildProduct3DGroup(
  sku: ProductSKU,
  options?: { isHeatmapMode?: boolean; heatmapIntensity?: number }
): Promise<THREE.Group> {
  const group = new THREE.Group();
  group.name = `sku_${sku.id}`;

  const { dimensions, materialProps, packageType } = sku;
  const isHeatmap = options?.isHeatmapMode || false;
  const heatmapFactor = options?.heatmapIntensity ?? 0.8;

  // Scale factor: cm to Three.js units (10 cm = 1.0 unit)
  const scale = 0.1;
  const w = (dimensions.width || 8) * scale;
  const h = (dimensions.height || 10) * scale;
  const d = (dimensions.depth || dimensions.width || 8) * scale;
  const r = (dimensions.diameter ? dimensions.diameter * 0.5 : dimensions.width * 0.5) * scale;

  // Base materials
  let bodyMat: THREE.Material;
  let lidMat: THREE.Material;
  let labelTexture: THREE.Texture;

  if (sku.textures.front) {
    try {
      labelTexture = await loadTextureFromDataUrl(sku.textures.front);
    } catch {
      labelTexture = createProceduralLabelTexture(sku);
    }
  } else {
    labelTexture = createProceduralLabelTexture(sku);
  }

  if (isHeatmap) {
    // Eye-tracking attention heatmap shader / material
    const heatColor = getHeatmapColor(sku.shelfIndex, heatmapFactor);
    bodyMat = new THREE.MeshStandardMaterial({
      color: heatColor,
      roughness: 0.3,
      metalness: 0.1,
      emissive: heatColor,
      emissiveIntensity: 0.3,
    });
    lidMat = bodyMat;
  } else {
    // Photorealistic PBR Materials
    lidMat = new THREE.MeshStandardMaterial({
      color: materialProps.lidColor || '#d4af37',
      metalness: materialProps.lidMetalness ?? 0.8,
      roughness: materialProps.lidRoughness ?? 0.25,
      envMapIntensity: 1.2,
    });

    if (sku.materialType === 'glass') {
      bodyMat = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        roughness: materialProps.roughness ?? 0.05,
        metalness: materialProps.metalness ?? 0.0,
        transmission: materialProps.transmission ?? 0.9,
        transparent: true,
        opacity: 0.98,
        ior: materialProps.ior ?? 1.5,
        thickness: 0.4,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.5,
      });
    } else if (sku.materialType === 'carton') {
      bodyMat = new THREE.MeshStandardMaterial({
        color: materialProps.color || '#f1f5f9',
        roughness: materialProps.roughness ?? 0.75,
        metalness: materialProps.metalness ?? 0.05,
        envMapIntensity: 0.6,
      });
    } else if (sku.materialType === 'film') {
      bodyMat = new THREE.MeshPhysicalMaterial({
        color: materialProps.color || '#ffffff',
        roughness: materialProps.roughness ?? 0.22,
        metalness: materialProps.metalness ?? 0.15,
        clearcoat: materialProps.clearcoat ?? 0.9,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.3,
      });
    } else if (sku.materialType === 'metal') {
      bodyMat = new THREE.MeshStandardMaterial({
        color: materialProps.color || '#cbd5e1',
        roughness: materialProps.roughness ?? 0.2,
        metalness: materialProps.metalness ?? 0.95,
        envMapIntensity: 1.8,
      });
    } else {
      // Plastic
      bodyMat = new THREE.MeshPhysicalMaterial({
        color: materialProps.color || '#ffffff',
        roughness: materialProps.roughness ?? 0.3,
        metalness: materialProps.metalness ?? 0.05,
        clearcoat: materialProps.clearcoat ?? 0.7,
        envMapIntensity: 1.0,
      });
    }
  }

  // Label Material with decal projection
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTexture,
    roughness: 0.35,
    metalness: 0.05,
    transparent: true,
  });

  // Construct Geometry according to Package Type
  switch (packageType) {
    case 'glass_jar': {
      // 1. Glass Jar (Стеклянная банка)
      const jarHeight = h;
      const jarRadius = r;
      const neckRadius = jarRadius * 0.88;
      const neckHeight = (dimensions.neckHeight || 1.5) * scale;
      const lidHeight = (dimensions.lidHeight || 1.2) * scale;

      // Outer glass cylinder
      const glassGeo = new THREE.CylinderGeometry(jarRadius, jarRadius, jarHeight - lidHeight, 36, 1, false);
      const glassMesh = new THREE.Mesh(glassGeo, bodyMat);
      glassMesh.position.y = (jarHeight - lidHeight) / 2;
      glassMesh.castShadow = true;
      glassMesh.receiveShadow = true;
      group.add(glassMesh);

      // Liquid / Content inside glass
      if (materialProps.hasLiquid && !isHeatmap) {
        const liquidGeo = new THREE.CylinderGeometry(
          jarRadius * 0.92,
          jarRadius * 0.92,
          (jarHeight - lidHeight) * 0.85,
          32
        );
        const liquidMat = new THREE.MeshStandardMaterial({
          color: materialProps.liquidColor || '#d6c28f',
          roughness: 0.5,
          metalness: 0.05,
        });
        const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
        liquidMesh.position.y = ((jarHeight - lidHeight) * 0.85) / 2 + 0.02;
        group.add(liquidMesh);
      }

      // Metal twist-off lid
      const lidGeo = new THREE.CylinderGeometry(neckRadius * 1.04, neckRadius * 1.04, lidHeight, 36);
      const lidMesh = new THREE.Mesh(lidGeo, lidMat);
      lidMesh.position.y = jarHeight - lidHeight / 2;
      lidMesh.castShadow = true;
      group.add(lidMesh);

      // Label wrapped around the front half of the jar
      const labelGeo = new THREE.CylinderGeometry(
        jarRadius * 1.002,
        jarRadius * 1.002,
        (jarHeight - lidHeight) * 0.75,
        36,
        1,
        true,
        Math.PI * 0.55,
        Math.PI * 0.9
      );
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.y = (jarHeight - lidHeight) / 2;
      group.add(labelMesh);
      break;
    }

    case 'plastic_tub': {
      // 2. Plastic Tub (Пластиковая банка / ведерко)
      const tubRadiusTop = r * 1.05;
      const tubRadiusBottom = r * 0.9;
      const tubHeight = h;
      const lidH = (dimensions.lidHeight || 0.8) * scale;

      const tubGeo = new THREE.CylinderGeometry(tubRadiusTop, tubRadiusBottom, tubHeight - lidH, 32);
      const tubMesh = new THREE.Mesh(tubGeo, bodyMat);
      tubMesh.position.y = (tubHeight - lidH) / 2;
      tubMesh.castShadow = true;
      tubMesh.receiveShadow = true;
      group.add(tubMesh);

      // Snap-on lid with outer lip
      const lidGeo = new THREE.CylinderGeometry(tubRadiusTop * 1.04, tubRadiusTop * 1.04, lidH, 32);
      const lidMesh = new THREE.Mesh(lidGeo, lidMat);
      lidMesh.position.y = tubHeight - lidH / 2;
      lidMesh.castShadow = true;
      group.add(lidMesh);

      // Front label
      const labelGeo = new THREE.CylinderGeometry(
        tubRadiusTop * 1.002,
        tubRadiusBottom * 1.002,
        (tubHeight - lidH) * 0.7,
        32,
        1,
        true,
        Math.PI * 0.55,
        Math.PI * 0.9
      );
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.y = (tubHeight - lidH) / 2;
      group.add(labelMesh);
      break;
    }

    case 'cup': {
      // 3. Cup (Стаканчик)
      const cupRadiusTop = r * 1.15;
      const cupRadiusBottom = r * 0.75;
      const cupHeight = h;
      const lidH = (dimensions.lidHeight || 0.6) * scale;

      const cupGeo = new THREE.CylinderGeometry(cupRadiusTop, cupRadiusBottom, cupHeight - lidH, 32);
      const cupMesh = new THREE.Mesh(cupGeo, bodyMat);
      cupMesh.position.y = (cupHeight - lidH) / 2;
      cupMesh.castShadow = true;
      cupMesh.receiveShadow = true;
      group.add(cupMesh);

      // Foil seal / plastic lid
      const lidGeo = new THREE.CylinderGeometry(cupRadiusTop * 1.05, cupRadiusTop * 1.05, lidH, 32);
      const lidMesh = new THREE.Mesh(lidGeo, lidMat);
      lidMesh.position.y = cupHeight - lidH / 2;
      lidMesh.castShadow = true;
      group.add(lidMesh);

      // Label
      const labelGeo = new THREE.CylinderGeometry(
        cupRadiusTop * 1.002,
        cupRadiusBottom * 1.002,
        (cupHeight - lidH) * 0.75,
        32,
        1,
        true,
        Math.PI * 0.55,
        Math.PI * 0.9
      );
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.y = (cupHeight - lidH) / 2;
      group.add(labelMesh);
      break;
    }

    case 'bottle': {
      // 4. Bottle (Бутылка)
      const bRadius = r;
      const bodyH = h * 0.65;
      const neckH = h * 0.25;
      const capH = h * 0.1;
      const neckRadius = r * 0.38;

      // Base cylinder
      const bGeo = new THREE.CylinderGeometry(bRadius, bRadius * 0.96, bodyH, 32);
      const bMesh = new THREE.Mesh(bGeo, bodyMat);
      bMesh.position.y = bodyH / 2;
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      group.add(bMesh);

      // Shoulder cone
      const shoulderH = neckH * 0.5;
      const shoulderGeo = new THREE.CylinderGeometry(neckRadius, bRadius, shoulderH, 32);
      const shoulderMesh = new THREE.Mesh(shoulderGeo, bodyMat);
      shoulderMesh.position.y = bodyH + shoulderH / 2;
      group.add(shoulderMesh);

      // Neck cylinder
      const neckGeo = new THREE.CylinderGeometry(neckRadius, neckRadius, neckH * 0.5, 32);
      const neckMesh = new THREE.Mesh(neckGeo, bodyMat);
      neckMesh.position.y = bodyH + shoulderH + (neckH * 0.5) / 2;
      group.add(neckMesh);

      // Cap
      const capGeo = new THREE.CylinderGeometry(neckRadius * 1.08, neckRadius * 1.08, capH, 32);
      const capMesh = new THREE.Mesh(capGeo, lidMat);
      capMesh.position.y = bodyH + shoulderH + neckH * 0.5 + capH / 2;
      capMesh.castShadow = true;
      group.add(capMesh);

      // Label
      const labelGeo = new THREE.CylinderGeometry(
        bRadius * 1.003,
        bRadius * 1.003,
        bodyH * 0.65,
        32,
        1,
        true,
        Math.PI * 0.55,
        Math.PI * 0.9
      );
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.y = bodyH * 0.55;
      group.add(labelMesh);
      break;
    }

    case 'carton_box': {
      // 5. Carton Box (Картонная коробка)
      const boxGeo = new THREE.BoxGeometry(w, h, d);
      const materials = [
        bodyMat, // right
        bodyMat, // left
        bodyMat, // top
        bodyMat, // bottom
        labelMat, // front (displays the label)
        bodyMat, // back
      ];
      const boxMesh = new THREE.Mesh(boxGeo, materials);
      boxMesh.position.y = h / 2;
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      group.add(boxMesh);
      break;
    }

    case 'doypack': {
      // 6. Doy-pack stand-up pouch (Пакет дой-пак)
      // Custom parametric pouch: wide expanding belly with curved sides, pinched top seal
      const pouchGroup = createDoypackMesh(w, h, d, bodyMat, labelMat, lidMat);
      pouchGroup.position.y = 0;
      group.add(pouchGroup);
      break;
    }

    case 'vacuum_pack': {
      // 7. Vacuum pack (Вакуумная упаковка)
      const vacGeo = new THREE.BoxGeometry(w, h, d);
      const vacMesh = new THREE.Mesh(vacGeo, [bodyMat, bodyMat, bodyMat, bodyMat, labelMat, bodyMat]);
      vacMesh.position.y = h / 2;
      vacMesh.castShadow = true;
      vacMesh.receiveShadow = true;
      group.add(vacMesh);

      // Sealed rim flanges
      const flangeGeo = new THREE.BoxGeometry(w * 1.08, h * 1.05, d * 0.15);
      const flangeMesh = new THREE.Mesh(flangeGeo, bodyMat);
      flangeMesh.position.set(0, h / 2, 0);
      group.add(flangeMesh);
      break;
    }

    case 'dough_roll': {
      // 8. Dough Roll (Тесто «Бабушка Аня»)
      // Elongated horizontal or vertical cylinder with crimped packaging ends
      const rollGeo = new THREE.CylinderGeometry(r, r, h * 0.88, 32);
      const rollMesh = new THREE.Mesh(rollGeo, bodyMat);
      rollMesh.position.y = h / 2;
      rollMesh.castShadow = true;
      rollMesh.receiveShadow = true;
      group.add(rollMesh);

      // Front film label
      const rollLabelGeo = new THREE.CylinderGeometry(
        r * 1.002,
        r * 1.002,
        h * 0.75,
        32,
        1,
        true,
        Math.PI * 0.55,
        Math.PI * 0.95
      );
      const rollLabelMesh = new THREE.Mesh(rollLabelGeo, labelMat);
      rollLabelMesh.position.y = h / 2;
      group.add(rollLabelMesh);

      // Crimped ends (top and bottom crimp seals)
      const crimpTop = createCrimpedEnd(r, scale, lidMat);
      crimpTop.position.set(0, h * 0.94, 0);
      group.add(crimpTop);

      const crimpBottom = createCrimpedEnd(r, scale, lidMat);
      crimpBottom.position.set(0, h * 0.06, 0);
      crimpBottom.rotation.z = Math.PI;
      group.add(crimpBottom);
      break;
    }

    case 'dumpling_bag': {
      // 9. Dumpling Bag (Упаковка пельменей)
      const bagGeo = new THREE.BoxGeometry(w, h * 0.88, d);
      // deform vertices slightly to create a puffy pillow look
      const pos = bagGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const yCoord = pos.getY(i);
        const factor = Math.cos((yCoord / (h * 0.88)) * Math.PI) * 0.25;
        pos.setZ(i, pos.getZ(i) * (1 + factor));
      }
      bagGeo.computeVertexNormals();

      const bagMesh = new THREE.Mesh(bagGeo, [bodyMat, bodyMat, bodyMat, bodyMat, labelMat, bodyMat]);
      bagMesh.position.y = h / 2;
      bagMesh.castShadow = true;
      bagMesh.receiveShadow = true;
      group.add(bagMesh);

      // Top crimp seal with clip
      const topCrimpGeo = new THREE.BoxGeometry(w * 1.05, h * 0.08, d * 0.2);
      const topCrimp = new THREE.Mesh(topCrimpGeo, lidMat);
      topCrimp.position.set(0, h * 0.96, 0);
      group.add(topCrimp);

      // Bottom seal
      const botCrimpGeo = new THREE.BoxGeometry(w * 1.02, h * 0.04, d * 0.2);
      const botCrimp = new THREE.Mesh(botCrimpGeo, lidMat);
      botCrimp.position.set(0, h * 0.02, 0);
      group.add(botCrimp);
      break;
    }

    case 'container': {
      // 10. Container (Прямоугольный контейнер)
      const trayH = h * 0.85;
      const trayGeo = new THREE.BoxGeometry(w, trayH, d);
      const trayMesh = new THREE.Mesh(trayGeo, bodyMat);
      trayMesh.position.y = trayH / 2;
      trayMesh.castShadow = true;
      trayMesh.receiveShadow = true;
      group.add(trayMesh);

      // Snap lid
      const cLidH = h * 0.15;
      const cLidGeo = new THREE.BoxGeometry(w * 1.04, cLidH, d * 1.04);
      const cLidMesh = new THREE.Mesh(cLidGeo, lidMat);
      cLidMesh.position.y = trayH + cLidH / 2;
      cLidMesh.castShadow = true;
      group.add(cLidMesh);

      // Top label sticker on lid
      const stickerGeo = new THREE.PlaneGeometry(w * 0.85, d * 0.85);
      const stickerMat = new THREE.MeshStandardMaterial({
        map: labelTexture,
        roughness: 0.3,
        transparent: true,
      });
      const stickerMesh = new THREE.Mesh(stickerGeo, stickerMat);
      stickerMesh.rotation.x = -Math.PI / 2;
      stickerMesh.position.set(0, trayH + cLidH + 0.005, 0);
      group.add(stickerMesh);
      break;
    }

    case 'tube': {
      // 11. Tube (Туба)
      const tubeRadius = r;
      const tubeBodyH = h * 0.8;
      const capH = (dimensions.lidHeight || 2.2) * scale;

      // Bottom cap
      const capGeo = new THREE.CylinderGeometry(tubeRadius * 0.9, tubeRadius * 0.9, capH, 32);
      const capMesh = new THREE.Mesh(capGeo, lidMat);
      capMesh.position.y = capH / 2;
      capMesh.castShadow = true;
      group.add(capMesh);

      // Body (cylinder transitioning into flattened top)
      const tubeGeo = new THREE.CylinderGeometry(tubeRadius * 0.95, tubeRadius, tubeBodyH, 32);
      const tubeMesh = new THREE.Mesh(tubeGeo, bodyMat);
      tubeMesh.position.y = capH + tubeBodyH / 2;
      tubeMesh.castShadow = true;
      tubeMesh.receiveShadow = true;
      group.add(tubeMesh);

      // Flat crimped top seal
      const crimpGeo = new THREE.BoxGeometry(tubeRadius * 2.1, h * 0.08, tubeRadius * 0.25);
      const crimpMesh = new THREE.Mesh(crimpGeo, lidMat);
      crimpMesh.position.set(0, capH + tubeBodyH + (h * 0.08) / 2, 0);
      group.add(crimpMesh);

      // Label on tube
      const labelGeo = new THREE.CylinderGeometry(
        tubeRadius * 1.002,
        tubeRadius * 1.002,
        tubeBodyH * 0.7,
        32,
        1,
        true,
        Math.PI * 0.55,
        Math.PI * 0.9
      );
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.y = capH + tubeBodyH * 0.5;
      group.add(labelMesh);
      break;
    }

    default: {
      const defaultGeo = new THREE.BoxGeometry(w, h, d);
      const defaultMesh = new THREE.Mesh(defaultGeo, [bodyMat, bodyMat, bodyMat, bodyMat, labelMat, bodyMat]);
      defaultMesh.position.y = h / 2;
      group.add(defaultMesh);
    }
  }

  return group;
}

/**
 * Creates a realistic doypack stand-up pouch mesh group
 */
function createDoypackMesh(
  w: number,
  h: number,
  d: number,
  bodyMat: THREE.Material,
  labelMat: THREE.Material,
  lidMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();

  // Pouch body using extruded elliptical shape with tapering
  const pouchGeo = new THREE.BoxGeometry(w, h * 0.9, d * 0.85, 16, 16, 16);
  const pos = pouchGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const yCoord = pos.getY(i);
    const normY = yCoord / (h * 0.45); // -1 to +1
    // Flatten Z towards top, expand belly in middle
    if (normY > 0.2) {
      const pinch = 1 - (normY - 0.2) * 0.9;
      pos.setZ(i, pos.getZ(i) * Math.max(0.1, pinch));
    } else {
      const belly = 1 + Math.cos(normY * Math.PI) * 0.25;
      pos.setZ(i, pos.getZ(i) * belly);
    }
  }
  pouchGeo.computeVertexNormals();

  const pouchMesh = new THREE.Mesh(pouchGeo, [bodyMat, bodyMat, bodyMat, bodyMat, labelMat, bodyMat]);
  pouchMesh.position.y = (h * 0.9) / 2;
  pouchMesh.castShadow = true;
  pouchMesh.receiveShadow = true;
  g.add(pouchMesh);

  // Top crimped seal with zipper lines
  const sealH = h * 0.1;
  const sealGeo = new THREE.BoxGeometry(w * 1.02, sealH, d * 0.12);
  const sealMesh = new THREE.Mesh(sealGeo, lidMat);
  sealMesh.position.set(0, h * 0.9 + sealH / 2, 0);
  sealMesh.castShadow = true;
  g.add(sealMesh);

  // Optional top spout / cap
  const spoutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16);
  const spoutMesh = new THREE.Mesh(spoutGeo, lidMat);
  spoutMesh.position.set(w * 0.3, h * 0.98, 0);
  g.add(spoutMesh);

  return g;
}

/**
 * Creates crimped twisted packaging ends for dough roll
 */
function createCrimpedEnd(radius: number, scale: number, mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const crimpGeo = new THREE.BoxGeometry(radius * 2.2, 0.06, 0.03);
  const crimpMesh = new THREE.Mesh(crimpGeo, mat);
  g.add(crimpMesh);

  // Tie clip
  const clipGeo = new THREE.CylinderGeometry(radius * 0.3, radius * 0.3, 0.04, 16);
  const clipMesh = new THREE.Mesh(clipGeo, mat);
  clipMesh.rotation.x = Math.PI / 2;
  g.add(clipMesh);
  return g;
}

/**
 * Generates an attention heatmap color based on shelf level and contrast
 */
function getHeatmapColor(shelfIndex: number, factor: number): THREE.Color {
  // Golden shelf (index 1) gets hot red/orange (high attention)
  // Top and middle get yellow/green
  // Bottom gets cool blue (low attention)
  if (shelfIndex === 1) {
    return new THREE.Color(1.0, 0.15, 0.05); // Hot red-orange
  } else if (shelfIndex === 0) {
    return new THREE.Color(0.9, 0.65, 0.1); // Warm amber
  } else if (shelfIndex === 2) {
    return new THREE.Color(0.2, 0.8, 0.4); // Green
  } else {
    return new THREE.Color(0.1, 0.4, 0.95); // Cold blue
  }
}
