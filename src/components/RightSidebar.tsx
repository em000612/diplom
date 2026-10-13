import React from 'react';
import { useStore } from '../context/StoreContext';
import { SHELF_TIERS } from '../utils/constants';
import { MaterialType } from '../types';
import { calculateMerchandisingMetrics } from '../utils/analytics';
import {
  Sliders,
  Sparkles,
  Layers,
  Palette,
  Tag,
  Eye,
  CheckCircle,
  AlertTriangle,
  MoveHorizontal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const RightSidebar: React.FC = () => {
  const {
    viewMode,
    selectedSku,
    updateSelectedSku,
    skus,
    selectedSkuId,
  } = useStore();

  if (!selectedSku) {
    return (
      <aside className="w-84 h-[calc(100vh-4rem)] glass-panel border-l border-neutral-800/80 p-4 flex items-center justify-center text-xs text-neutral-400">
        Выберите товар для настройки параметров
      </aside>
    );
  }

  const { dimensions, materialProps, isCompetitor } = selectedSku;
  const metrics = calculateMerchandisingMetrics(skus, selectedSkuId);

  const materialsList: { id: MaterialType; label: string }[] = [
    { id: 'glass', label: 'Стекло' },
    { id: 'plastic', label: 'Пластик' },
    { id: 'carton', label: 'Картон' },
    { id: 'film', label: 'Пленка' },
    { id: 'metal', label: 'Металл' },
  ];

  return (
    <aside className="w-84 h-[calc(100vh-4rem)] glass-panel border-l border-neutral-800/80 flex flex-col select-none overflow-hidden z-20">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Header with SKU title */}
        <div className="pb-3 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Инспектор параметров
              </span>
              {isCompetitor && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  Конкурент
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5 truncate max-w-[210px]">
              {selectedSku.brand} • {selectedSku.name}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-400">
            {selectedSku.price} {selectedSku.currency}
          </span>
        </div>

        {/* SECTION A: Merchandising & Shelf Layout (Always visible or Shelf mode) */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 mb-2.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Выкладка на стеллаже</span>
          </span>

          <div className="space-y-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
            {/* Shelf Tier Selection */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400 font-medium">Полка стеллажа:</span>
                <span className="text-indigo-300 font-semibold text-[11px]">
                  {SHELF_TIERS.find((t) => t.id === selectedSku.shelfIndex)?.shortLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {SHELF_TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => updateSelectedSku({ shelfIndex: tier.id })}
                    className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-medium transition-all border ${
                      selectedSku.shelfIndex === tier.id
                        ? tier.isGolden
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                        : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span>{tier.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Facings Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Количество фейсингов:</span>
                <span className="text-neutral-100 font-bold font-mono">{selectedSku.facings} шт.</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={selectedSku.facings}
                onChange={(e) => updateSelectedSku({ facings: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>6</span>
                <span>8</span>
              </div>
            </div>

            {/* Depth Rows Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Глубина выкладки (рядов):</span>
                <span className="text-neutral-100 font-bold font-mono">{selectedSku.depthRows} ряда</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={selectedSku.depthRows}
                onChange={(e) => updateSelectedSku({ depthRows: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Spacing / Gap Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Зазор между товарами:</span>
                <span className="text-neutral-100 font-bold font-mono">{selectedSku.gap} см</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.2"
                value={selectedSku.gap}
                onChange={(e) => updateSelectedSku({ gap: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Horizontal Position on shelf */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Позиция на полке (X):</span>
                <span className="text-neutral-100 font-mono text-[11px]">{selectedSku.shelfPositionX.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-0.45"
                max="0.45"
                step="0.05"
                value={selectedSku.shelfPositionX}
                onChange={(e) => updateSelectedSku({ shelfPositionX: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SECTION B: 3D Dimensions (Parametric) */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 mb-2.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Параметрические Размеры (3D)</span>
          </span>

          <div className="space-y-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
            {/* Height */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Высота (Height):</span>
                <span className="text-neutral-100 font-mono font-bold">{dimensions.height} см</span>
              </div>
              <input
                type="range"
                min="4"
                max="32"
                step="0.5"
                value={dimensions.height}
                onChange={(e) =>
                  updateSelectedSku({
                    dimensions: { ...dimensions, height: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Width */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Ширина (Width / Диаметр):</span>
                <span className="text-neutral-100 font-mono font-bold">{dimensions.width} см</span>
              </div>
              <input
                type="range"
                min="4"
                max="25"
                step="0.5"
                value={dimensions.width}
                onChange={(e) =>
                  updateSelectedSku({
                    dimensions: {
                      ...dimensions,
                      width: parseFloat(e.target.value),
                      diameter: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Depth */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Глубина (Depth):</span>
                <span className="text-neutral-100 font-mono font-bold">{dimensions.depth || dimensions.width} см</span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                step="0.5"
                value={dimensions.depth || dimensions.width}
                onChange={(e) =>
                  updateSelectedSku({
                    dimensions: { ...dimensions, depth: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SECTION C: PBR Material & Color Settings */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 mb-2.5">
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <span>Материал &amp; Свойства PBR</span>
          </span>

          <div className="space-y-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
            {/* Material Selector */}
            <div className="grid grid-cols-3 gap-1">
              {materialsList.map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateSelectedSku({ materialType: m.id })}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    selectedSku.materialType === m.id
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Primary & Lid Color Pickers */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Цвет корпуса:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={materialProps.color || '#3b82f6'}
                    onChange={(e) =>
                      updateSelectedSku({
                        materialProps: { ...materialProps, color: e.target.value },
                      })
                    }
                    className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-neutral-300">{materialProps.color}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Цвет крышки:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={materialProps.lidColor || '#d4af37'}
                    onChange={(e) =>
                      updateSelectedSku({
                        materialProps: { ...materialProps, lidColor: e.target.value },
                      })
                    }
                    className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-neutral-300">{materialProps.lidColor}</span>
                </div>
              </div>
            </div>

            {/* Roughness Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Шероховатость (Roughness):</span>
                <span className="text-neutral-200 font-mono text-[11px]">{materialProps.roughness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={materialProps.roughness}
                onChange={(e) =>
                  updateSelectedSku({
                    materialProps: { ...materialProps, roughness: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Metalness Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Металличность (Metalness):</span>
                <span className="text-neutral-200 font-mono text-[11px]">{materialProps.metalness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={materialProps.metalness}
                onChange={(e) =>
                  updateSelectedSku({
                    materialProps: { ...materialProps, metalness: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SECTION D: Retail Price Tag & Product Info */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 mb-2.5">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ценник &amp; Ритейл-метаданные</span>
          </span>

          <div className="space-y-2.5 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Бренд:</label>
              <input
                type="text"
                value={selectedSku.brand}
                onChange={(e) => updateSelectedSku({ brand: e.target.value })}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Название товара:</label>
              <input
                type="text"
                value={selectedSku.name}
                onChange={(e) => updateSelectedSku({ name: e.target.value })}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Цена (₽):</label>
                <input
                  type="number"
                  value={selectedSku.price}
                  onChange={(e) => updateSelectedSku({ price: parseFloat(e.target.value) || 0 })}
                  className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Объем / Вес:</label>
                <input
                  type="text"
                  value={selectedSku.volumeText}
                  onChange={(e) => updateSelectedSku({ volumeText: e.target.value })}
                  className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Промо-бейдж (шелфтокер):</label>
              <input
                type="text"
                placeholder="ХИТ, АКЦИЯ -20%, ЭКО..."
                value={selectedSku.promoBadge || ''}
                onChange={(e) => updateSelectedSku({ promoBadge: e.target.value })}
                className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-medium"
              />
            </div>
          </div>
        </div>

        {/* SECTION E: Live Merchandising KPI Card */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-neutral-900 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Share of Shelf (SoS)</span>
            </span>
            <span className="font-mono font-bold text-indigo-400 text-sm">
              {metrics.shareOfShelfByFacings}%
            </span>
          </div>

          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${metrics.shareOfShelfByFacings}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-neutral-800/80">
            <div>
              <span className="text-neutral-400 block">Фронтальная площадь:</span>
              <strong className="text-neutral-200 font-mono">{metrics.heroFrontalAreaCm2} см²</strong>
            </div>
            <div>
              <span className="text-neutral-400 block">Индекс заметности:</span>
              <strong className="text-emerald-400 font-mono">{metrics.visibilityIndex} / 100</strong>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
