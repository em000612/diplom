import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { PACKAGE_TYPE_CATALOG } from '../utils/constants';
import { PackageType } from '../types';
import { removeImageBackground } from '../utils/textureGenerator';
import {
  Upload,
  Plus,
  Copy,
  Trash2,
  Sparkles,
  Scissors,
  Layers,
  CheckCircle2,
  Image as ImageIcon,
  FolderOpen,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const LeftSidebar: React.FC = () => {
  const {
    skus,
    selectedSkuId,
    selectedSku,
    setSelectedSkuId,
    updateSelectedSku,
    addNewSku,
    duplicateSku,
    deleteSku,
    showToast,
  } = useStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [activeUploadTab, setActiveUploadTab] = useState<'single' | 'multi' | 'net'>('single');

  // Handle Image File Upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Пожалуйста, загрузите изображение (PNG, JPG или WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      // Update texture on selected SKU
      updateSelectedSku({
        textures: {
          ...selectedSku?.textures,
          front: dataUrl,
        },
      });

      showToast('Изображение успешно нанесено на упаковку');

      // Auto-trigger AI classification
      triggerAiClassification(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini AI classification
  const triggerAiClassification = async (imageDataUrl: string) => {
    setIsClassifying(true);
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl }),
      });
      const data = await res.json();

      if (data.success && data.packageType) {
        const catalogInfo = PACKAGE_TYPE_CATALOG.find((p) => p.type === data.packageType);
        updateSelectedSku({
          packageType: data.packageType as PackageType,
          brand: data.brandName || selectedSku?.brand || 'Brand',
          name: data.productName || selectedSku?.name || 'Товар',
          materialType: (data.material as any) || catalogInfo?.defaultMaterial || 'plastic',
          dimensions: {
            ...catalogInfo?.defaultDimensions,
            ...(data.estimatedDimensions || {}),
          },
          materialProps: selectedSku
            ? {
                ...selectedSku.materialProps,
                color: data.dominantColor || selectedSku.materialProps.color || '#3b82f6',
              }
            : {
                color: data.dominantColor || '#3b82f6',
                roughness: 0.1,
                metalness: 0.05,
                transmission: 0.85,
                opacity: 1.0,
                clearcoat: 0.9,
                ior: 1.5,
                lidColor: '#d4af37',
                lidMetalness: 0.8,
                lidRoughness: 0.25,
              },
        });

        showToast(`AI определил: ${catalogInfo?.title || data.packageType} (${Math.round((data.confidence || 0.9) * 100)}% точность)`);
      }
    } catch (err) {
      console.warn('AI classification fallback:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  // Client-side AI background remover
  const handleRemoveBackground = async () => {
    if (!selectedSku?.textures.front) {
      showToast('Сначала загрузите изображение товара');
      return;
    }
    setIsRemovingBg(true);
    try {
      const cleaned = await removeImageBackground(selectedSku.textures.front, 30);
      updateSelectedSku({
        textures: {
          ...selectedSku.textures,
          front: cleaned,
        },
      });
      showToast('Фон изображения успешно удален!');
    } catch (err) {
      showToast('Ошибка при удалении фона');
    } finally {
      setIsRemovingBg(false);
    }
  };

  return (
    <aside className="w-80 h-[calc(100vh-4rem)] glass-panel border-r border-neutral-800/80 flex flex-col select-none overflow-hidden z-20">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* SECTION 1: Drag & Drop Upload Zone */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Загрузка этикетки / упаковки
            </span>
            <div className="flex bg-neutral-900 rounded-lg p-0.5 border border-neutral-800 text-[10px]">
              <button
                onClick={() => setActiveUploadTab('single')}
                className={`px-2 py-0.5 rounded font-medium ${
                  activeUploadTab === 'single' ? 'bg-indigo-600 text-white' : 'text-neutral-400'
                }`}
              >
                1 фото
              </button>
              <button
                onClick={() => setActiveUploadTab('multi')}
                className={`px-2 py-0.5 rounded font-medium ${
                  activeUploadTab === 'multi' ? 'bg-indigo-600 text-white' : 'text-neutral-400'
                }`}
              >
                Мульти
              </button>
              <button
                onClick={() => setActiveUploadTab('net')}
                className={`px-2 py-0.5 rounded font-medium ${
                  activeUploadTab === 'net' ? 'bg-indigo-600 text-white' : 'text-neutral-400'
                }`}
              >
                Развертка
              </button>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-neutral-700/80 hover:border-neutral-600 bg-neutral-900/40'
            }`}
          >
            <input
              type="file"
              id="file-upload-input"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer block">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-neutral-800/80 flex items-center justify-center text-indigo-400">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-neutral-200">
                Перетащите фото товара сюда
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Поддержка JPG, PNG, WEBP (до 25 МБ)
              </p>
            </label>

            {/* Quick Actions after upload */}
            {selectedSku?.textures.front && (
              <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-center gap-2">
                <button
                  onClick={handleRemoveBackground}
                  disabled={isRemovingBg}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1.5 transition-colors"
                >
                  <Scissors className="w-3.5 h-3.5 text-pink-400" />
                  <span>{isRemovingBg ? 'Удаление...' : 'Удалить фон'}</span>
                </button>
                <button
                  onClick={() => triggerAiClassification(selectedSku.textures.front!)}
                  disabled={isClassifying}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isClassifying ? 'AI анализ...' : 'AI авто-тип'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: 11 Packaging Shapes Catalog */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Тип 3D Упаковки ({PACKAGE_TYPE_CATALOG.length})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {PACKAGE_TYPE_CATALOG.map((item) => {
              const isSelected = selectedSku?.packageType === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => {
                    updateSelectedSku({
                      packageType: item.type,
                      materialType: item.defaultMaterial,
                      dimensions: { ...item.defaultDimensions },
                    });
                    showToast(`Выбрана форма: ${item.title}`);
                  }}
                  className={`p-2 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-neutral-900/50 border-neutral-800/80 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold leading-tight line-clamp-1">{item.title}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-1">{item.categoryExamples}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: SKU List on Shelf */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Товары на полке ({skus.length} SKU)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => addNewSku(false)}
                className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow"
                title="Добавить свой товар"
              >
                <Plus className="w-3 h-3" />
                <span>Свой SKU</span>
              </button>
              <button
                onClick={() => addNewSku(true)}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium flex items-center gap-1 border border-neutral-700"
                title="Добавить товар конкурента"
              >
                <Plus className="w-3 h-3" />
                <span>Конкурент</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {skus.map((sku) => {
              const isSelected = sku.id === selectedSkuId;
              return (
                <div
                  key={sku.id}
                  onClick={() => setSelectedSkuId(sku.id)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-neutral-800 border-indigo-500/70 shadow-md'
                      : 'bg-neutral-900/40 border-neutral-800/60 hover:bg-neutral-850 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div
                      className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs"
                      style={{
                        backgroundColor: sku.materialProps.color || '#3b82f6',
                        color: '#ffffff',
                      }}
                    >
                      {sku.brand[0] || 'P'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-100 truncate">
                          {sku.brand}
                        </span>
                        {sku.isCompetitor ? (
                          <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                            Конкурент
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                            Наш бренд
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">{sku.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                        <span>{sku.facings} фейс.</span>
                        <span>•</span>
                        <span>{sku.price} ₽</span>
                        <span>•</span>
                        <span>Полка #{sku.shelfIndex + 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => duplicateSku(sku.id)}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50"
                      title="Дублировать SKU"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteSku(sku.id)}
                      className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-700/50"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
