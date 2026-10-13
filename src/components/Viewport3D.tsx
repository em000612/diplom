import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { useStore } from '../context/StoreContext';
import { buildProduct3DGroup } from '../utils/geometryBuilder';
import { buildSupermarketGondola, createPriceTagMesh } from '../utils/shelfBuilder';
import { SHELF_TIERS } from '../utils/constants';
import { Camera, Download, Eye, Flame, Maximize2, RotateCcw, Video, Sparkles, Box } from 'lucide-react';

export const Viewport3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const {
    viewMode,
    skus,
    selectedSkuId,
    selectedSku,
    setSelectedSkuId,
    cameraPreset,
    setCameraPreset,
    showPriceTags,
    showDimensions,
    showHeatmap,
    setShowHeatmap,
    lightingPreset,
    showToast,
  } = useStore();

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const productsGroupRef = useRef<THREE.Group | null>(null);
  const gondolaGroupRef = useRef<THREE.Group | null>(null);
  const studioGroupRef = useRef<THREE.Group | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambLightRef = useRef<THREE.AmbientLight | null>(null);

  // Video recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#090d16');
    scene.fog = new THREE.FogExp2('#090d16', 0.08);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 0.45, 2.8);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    mountRef.current.replaceChildren(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 8.0;
    controls.minDistance = 0.5;
    controls.target.set(0, 0.35, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambLight = new THREE.AmbientLight('#ffffff', 0.85);
    scene.add(ambLight);
    ambLightRef.current = ambLight;

    const dirLight = new THREE.DirectionalLight('#ffffff', 1.6);
    dirLight.position.set(2.5, 4.0, 3.0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 10;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.top = 2.5;
    dirLight.shadow.camera.bottom = -2.5;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight('#93c5fd', 0.6);
    fillLight.position.set(-2.5, 2.0, 1.5);
    scene.add(fillLight);

    // Shelf accent spot light
    const spotLight = new THREE.SpotLight('#fef08a', 0.9, 5, Math.PI / 4, 0.4);
    spotLight.position.set(0, 2.2, 1.8);
    spotLight.target.position.set(0, 0.45, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    // Containers
    const gondola = buildSupermarketGondola();
    scene.add(gondola);
    gondolaGroupRef.current = gondola;

    const productsGroup = new THREE.Group();
    productsGroup.name = 'shelf_products';
    scene.add(productsGroup);
    productsGroupRef.current = productsGroup;

    const studioGroup = new THREE.Group();
    studioGroup.name = 'studio_single_product';
    scene.add(studioGroup);
    studioGroupRef.current = studioGroup;

    // Studio pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.08, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.25,
      metalness: 0.5,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, -0.04, 0);
    pedestal.receiveShadow = true;
    studioGroup.add(pedestal);

    // Studio grid ring
    const ringGeo = new THREE.RingGeometry(0.82, 0.85, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#6366f1', side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.002;
    studioGroup.add(ring);

    // Click to select SKU in 3D scene (Raycasting)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      if (!mountRef.current || !cameraRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const targetGroup = viewMode === 'studio' ? studioGroupRef.current : productsGroupRef.current;
      if (!targetGroup) return;

      const intersects = raycaster.intersectObjects(targetGroup.children, true);
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && obj.parent && obj.parent !== targetGroup) {
          if (obj.name && obj.name.startsWith('sku_')) {
            const foundId = obj.name.replace('sku_', '');
            setSelectedSkuId(foundId);
            break;
          }
          obj = obj.parent;
        }
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Studio turntable slow rotation when in studio mode
      if (viewMode === 'studio' && studioGroupRef.current) {
        // Slow subtle spin if desired
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      renderer.dispose();
    };
  }, []);

  // Update Scene View Mode (Studio vs Shelf)
  useEffect(() => {
    if (!gondolaGroupRef.current || !studioGroupRef.current || !productsGroupRef.current) return;

    if (viewMode === 'studio') {
      gondolaGroupRef.current.visible = false;
      productsGroupRef.current.visible = false;
      studioGroupRef.current.visible = true;

      if (controlsRef.current && cameraRef.current) {
        controlsRef.current.target.set(0, (selectedSku?.dimensions.height || 10) * 0.05, 0);
        cameraRef.current.position.set(0, 0.25, 0.85);
      }
    } else {
      gondolaGroupRef.current.visible = true;
      productsGroupRef.current.visible = true;
      studioGroupRef.current.visible = false;

      if (controlsRef.current && cameraRef.current) {
        controlsRef.current.target.set(0, 0.45, 0);
      }
    }
  }, [viewMode]);

  // Update Camera Preset
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (viewMode === 'studio') {
      const targetH = (selectedSku?.dimensions.height || 10) * 0.05;
      ctrl.target.set(0, targetH, 0);
      switch (cameraPreset) {
        case 'front':
          cam.position.set(0, targetH, 0.85);
          break;
        case 'top':
          cam.position.set(0, 1.1, 0.05);
          break;
        case 'angle_45':
          cam.position.set(0.6, targetH + 0.3, 0.7);
          break;
        case 'eye_level':
        default:
          cam.position.set(0, targetH + 0.1, 0.8);
          break;
      }
    } else {
      // Shelf mode
      switch (cameraPreset) {
        case 'front':
          ctrl.target.set(0, 0.45, 0);
          cam.position.set(0, 0.45, 2.4);
          break;
        case 'eye_level':
          ctrl.target.set(0, 0.45, 0);
          cam.position.set(0, 0.5, 2.2);
          break;
        case 'angle_45':
          ctrl.target.set(0, 0.35, 0);
          cam.position.set(1.6, 0.8, 2.0);
          break;
        case 'top':
          ctrl.target.set(0, 0.2, 0);
          cam.position.set(0, 2.6, 1.2);
          break;
        default:
          break;
      }
    }
  }, [cameraPreset, viewMode]);

  // Update Lighting Preset
  useEffect(() => {
    if (!dirLightRef.current || !ambLightRef.current) return;
    if (lightingPreset === 'supermarket_bright') {
      dirLightRef.current.intensity = 1.7;
      dirLightRef.current.color.set('#ffffff');
      ambLightRef.current.intensity = 0.9;
    } else if (lightingPreset === 'warm_boutique') {
      dirLightRef.current.intensity = 1.3;
      dirLightRef.current.color.set('#fed7aa');
      ambLightRef.current.intensity = 0.7;
    } else {
      // Studio
      dirLightRef.current.intensity = 1.9;
      dirLightRef.current.color.set('#f8fafc');
      ambLightRef.current.intensity = 0.6;
    }
  }, [lightingPreset]);

  // Re-build 3D Meshes when SKUs, facings, or visual settings change
  useEffect(() => {
    let isCancelled = false;

    async function updateMeshes() {
      if (viewMode === 'studio') {
        // Build single product for studio
        if (!studioGroupRef.current || !selectedSku) return;

        // Clear existing product in studio (keep pedestal at index 0 and 1)
        while (studioGroupRef.current.children.length > 2) {
          studioGroupRef.current.remove(studioGroupRef.current.children[2]);
        }

        const meshGroup = await buildProduct3DGroup(selectedSku, {
          isHeatmapMode: showHeatmap,
        });

        if (isCancelled) return;
        meshGroup.position.set(0, 0, 0);
        studioGroupRef.current.add(meshGroup);

        // Dimensions bounding lines if requested
        if (showDimensions) {
          const w = (selectedSku.dimensions.width || 8) * 0.1;
          const h = (selectedSku.dimensions.height || 10) * 0.1;
          const d = (selectedSku.dimensions.depth || 8) * 0.1;
          const boxHelper = new THREE.BoxHelper(meshGroup, 0x6366f1);
          studioGroupRef.current.add(boxHelper);
        }
      } else {
        // Build multi-product shelf scene
        if (!productsGroupRef.current) return;
        productsGroupRef.current.clear();

        // Place all SKUs on shelves
        for (const sku of skus) {
          const tier = SHELF_TIERS.find((t) => t.id === sku.shelfIndex) || SHELF_TIERS[1];
          const shelfY = tier.yPosition + 0.015; // sit on top of steel plate

          const skuWidth = (sku.dimensions.width || 8) * 0.1;
          const skuDepth = (sku.dimensions.depth || 8) * 0.1;
          const gap = (sku.gap || 0.8) * 0.1;

          const startX = sku.shelfPositionX * 1.8; // map -0.5..0.5 across shelf width

          // Create base mesh group once for cloning
          const baseGroup = await buildProduct3DGroup(sku, {
            isHeatmapMode: showHeatmap,
          });

          if (isCancelled) return;

          // Multiply facings horizontally
          const skuContainer = new THREE.Group();
          skuContainer.name = `sku_${sku.id}`;

          for (let f = 0; f < sku.facings; f++) {
            const facingX = startX + f * (skuWidth + gap);

            // Multiply depth rows
            for (let r = 0; r < sku.depthRows; r++) {
              const rowZ = -r * (skuDepth + 0.02);
              const clone = baseGroup.clone(true);
              clone.position.set(facingX, shelfY, rowZ);
              skuContainer.add(clone);
            }
          }

          // Price Tag attached on the front rail
          if (showPriceTags) {
            const tag = createPriceTagMesh(sku);
            const tagCenterX = startX + (sku.facings * (skuWidth + gap) - gap) / 2;
            tag.position.set(tagCenterX, shelfY - 0.02, 0.55 / 2 + 0.015);
            skuContainer.add(tag);
          }

          // Visual selection highlight ring
          if (sku.id === selectedSkuId) {
            const highlightGeo = new THREE.RingGeometry(0.12, 0.14, 32);
            const highlightMat = new THREE.MeshBasicMaterial({
              color: '#38bdf8',
              side: THREE.DoubleSide,
            });
            const highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
            highlightMesh.rotation.x = -Math.PI / 2;
            const centerX = startX + (sku.facings * (skuWidth + gap) - gap) / 2;
            highlightMesh.position.set(centerX, shelfY + 0.001, 0);
            skuContainer.add(highlightMesh);
          }

          productsGroupRef.current.add(skuContainer);
        }
      }
    }

    updateMeshes();

    return () => {
      isCancelled = true;
    };
  }, [skus, selectedSkuId, viewMode, showPriceTags, showDimensions, showHeatmap]);

  // Export Screenshot (High-Res PNG)
  const handleExportScreenshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `shelfcraft-render-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    showToast('Рендер сохранен в высоком разрешении (PNG)');
  };

  // Export 3D Model (GLTF / GLB)
  const handleExportGLTF = () => {
    if (!sceneRef.current) return;
    const exporter = new GLTFExporter();
    const exportTarget = viewMode === 'studio' ? studioGroupRef.current : productsGroupRef.current;
    if (!exportTarget) return;

    exporter.parse(
      exportTarget,
      (gltf) => {
        const output = JSON.stringify(gltf, null, 2);
        const blob = new Blob([output], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `package-model-${selectedSku?.name || 'product'}.gltf`;
        link.href = URL.createObjectURL(blob);
        link.click();
        showToast('3D модель успешно экспортирована в GLTF');
      },
      (error) => {
        console.error('GLTF Export Error:', error);
        showToast('Ошибка при экспорте GLTF');
      },
      { binary: false }
    );
  };

  // 360° Video Recording via MediaRecorder
  const handleToggleVideoRecord = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      showToast('Запись 360° видео завершена, скачивание...');
    } else {
      // Start recording
      if (!rendererRef.current) return;
      const stream = rendererRef.current.domElement.captureStream(30);
      recordedChunksRef.current = [];

      try {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `shelfcraft-360-video-${Date.now()}.webm`;
          link.href = url;
          link.click();
        };

        recorder.start();
        setIsRecording(true);
        showToast('Запись видео начата! Вращайте сцену мышью или наблюдайте');

        // Auto-stop after 8 seconds
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
            setIsRecording(false);
          }
        }, 8000);
      } catch (err) {
        console.error('MediaRecorder error:', err);
        showToast('Запись видео не поддерживается в этом браузере');
      }
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-neutral-950">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Viewport Controls (Top Right Overlay) */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        {/* Camera Angles */}
        <div className="glass-panel rounded-xl p-1 flex items-center gap-1 shadow-xl">
          <button
            onClick={() => setCameraPreset('eye_level')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              cameraPreset === 'eye_level'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Уровень глаз (Eye-level)"
          >
            Уровень глаз
          </button>
          <button
            onClick={() => setCameraPreset('front')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              cameraPreset === 'front'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Фронтальный ракурс"
          >
            Фронт
          </button>
          <button
            onClick={() => setCameraPreset('angle_45')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              cameraPreset === 'angle_45'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Угол 45°"
          >
            45° Ракурс
          </button>
          <button
            onClick={() => setCameraPreset('top')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              cameraPreset === 'top'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Вид сверху (глубина выкладки)"
          >
            Сверху
          </button>
        </div>

        {/* Heatmap Toggle */}
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`glass-panel px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xl ${
            showHeatmap
              ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-amber-500/20'
              : 'text-neutral-300 hover:text-amber-400 hover:bg-neutral-800/60'
          }`}
          title="Симуляция внимания покупателя (Eye-tracking Heatmap)"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{showHeatmap ? 'Теплокарта: ВКЛ' : 'Теплокарта'}</span>
        </button>

        {/* Export Dropdown / Action Buttons */}
        <div className="glass-panel rounded-xl p-1 flex items-center gap-1 shadow-xl">
          <button
            onClick={handleExportScreenshot}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800/60 rounded-lg transition-colors"
            title="Снимок высокого разрешения (PNG)"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleVideoRecord}
            className={`p-1.5 rounded-lg transition-colors ${
              isRecording ? 'text-red-500 bg-red-500/20 animate-pulse' : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
            title={isRecording ? 'Остановить запись видео' : 'Запись видео 360° (MP4/WebM)'}
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportGLTF}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800/60 rounded-lg transition-colors"
            title="Экспорт 3D модели (GLTF/GLB)"
          >
            <Box className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Viewport Status Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
        <div className="glass-panel px-3 py-2 rounded-xl text-xs text-neutral-400 flex items-center gap-3 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-neutral-200 font-medium">
              {viewMode === 'studio' ? '3D Студия Упаковки' : 'Виртуальный стеллаж супермаркета'}
            </span>
          </div>
          <span className="text-neutral-600">|</span>
          <span>{skus.length} SKU на полке</span>
          <span className="text-neutral-600">|</span>
          <span>
            Активный:{' '}
            <strong className="text-neutral-200">
              {selectedSku?.brand} - {selectedSku?.name.slice(0, 18)}...
            </strong>
          </span>
        </div>

        {showHeatmap && (
          <div className="glass-panel px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border-amber-500/30 bg-amber-950/40 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Высокое внимание</span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <span>Среднее</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Низкое</span>
          </div>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 glass-panel px-3 py-1.5 rounded-xl border-red-500/40 bg-red-950/40 text-red-400 text-xs font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>REC: Запись видео 360°...</span>
        </div>
      )}
    </div>
  );
};
