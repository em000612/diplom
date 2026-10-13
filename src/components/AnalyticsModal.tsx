import React from 'react';
import { useStore } from '../context/StoreContext';
import { calculateMerchandisingMetrics } from '../utils/analytics';
import {
  X,
  TrendingUp,
  Award,
  Layers,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  BarChart,
  Percent,
  Compass,
} from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const { skus, selectedSkuId } = useStore();

  if (!isOpen) return null;

  const metrics = calculateMerchandisingMetrics(skus, selectedSkuId);
  const heroSku = skus.find((s) => s.id === selectedSkuId) || skus[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel-elevated w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-neutral-700/80 shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Аналитика Мерчендайзинга &amp; Доля Полки (SoS)</h2>
              <p className="text-xs text-neutral-400">
                Сравнение ключевого SKU с конкурентами на текущем уровне стеллажа
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold glass-panel text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Печать / Экспорт PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-4 gap-4">
            {/* Card 1: Share of Shelf */}
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Share of Shelf (SoS)</span>
                <Percent className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {metrics.shareOfShelfByFacings}%
                </span>
                <span className="text-xs text-neutral-400 ml-1.5">по фейсингам</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: `${metrics.shareOfShelfByFacings}%` }}
                />
              </div>
            </div>

            {/* Card 2: Visibility Index */}
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Индекс Заметности</span>
                <Eye className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {metrics.visibilityIndex}
                </span>
                <span className="text-xs text-neutral-400 ml-1.5">/ 100 баллов</span>
              </div>
              <div className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>{metrics.isGoldenShelf ? 'Золотая полка (+35% к вниманию)' : 'Базовая полка'}</span>
              </div>
            </div>

            {/* Card 3: Total Frontal Area */}
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Фронтальная площадь</span>
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {metrics.heroFrontalAreaCm2}
                </span>
                <span className="text-xs text-neutral-400 ml-1.5">см²</span>
              </div>
              <span className="text-[11px] text-neutral-400">
                {metrics.heroFacings} фейсингов в бренд-блоке
              </span>
            </div>

            {/* Card 4: Linear Shelf Width */}
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Длина выкладки</span>
                <Compass className="w-4 h-4 text-purple-400" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {metrics.heroLinearWidthCm}
                </span>
                <span className="text-xs text-neutral-400 ml-1.5">см</span>
              </div>
              <span className="text-[11px] text-neutral-400">
                из {metrics.totalLinearWidthCm} см на полке
              </span>
            </div>
          </div>

          {/* SECTION 2: Competitive Comparison Matrix Table */}
          <div className="rounded-xl border border-neutral-800 overflow-hidden bg-neutral-900/40">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Матрица сравнения SKU и конкурентных брендов
              </h3>
              <span className="text-xs text-neutral-400">Всего SKU: {metrics.competitorComparison.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-800/50 text-neutral-400 border-b border-neutral-800 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Бренд &amp; Товар</th>
                    <th className="px-4 py-3 text-center">Фейсинги</th>
                    <th className="px-4 py-3 text-center">Длина (см)</th>
                    <th className="px-4 py-3 text-center">Площадь (см²)</th>
                    <th className="px-4 py-3 text-center">Доля полки (SoS)</th>
                    <th className="px-4 py-3 text-center">Индекс заметности</th>
                    <th className="px-4 py-3 text-right">Цена</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {metrics.competitorComparison.map((comp) => {
                    const isHero = comp.skuId === heroSku.id;
                    return (
                      <tr
                        key={comp.skuId}
                        className={`transition-colors ${
                          isHero ? 'bg-indigo-950/20 font-semibold' : 'hover:bg-neutral-850/50'
                        }`}
                      >
                        <td className="px-4 py-3 flex items-center gap-2.5">
                          {isHero ? (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-neutral-500"></span>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-neutral-100 font-bold">{comp.brand}</span>
                              {isHero && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                                  НАШ БРЕНД
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-neutral-400">{comp.name}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center font-mono font-bold text-neutral-200">
                          {comp.facings}
                        </td>

                        <td className="px-4 py-3 text-center font-mono text-neutral-300">
                          {comp.linearWidthCm} см
                        </td>

                        <td className="px-4 py-3 text-center font-mono text-neutral-300">
                          {comp.frontalAreaCm2} см²
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isHero ? 'bg-indigo-500' : 'bg-neutral-500'
                                }`}
                                style={{ width: `${comp.sharePercent}%` }}
                              />
                            </div>
                            <span className="font-mono text-neutral-200 w-8">{comp.sharePercent}%</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              comp.visibilityScore > 80
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : comp.visibilityScore > 60
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {comp.visibilityScore} / 100
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-neutral-100">
                          {comp.price} ₽
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: Merchandising Compliance & Planogram Audit */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Чек-лист соблюдения стандартов мерчендайзинга (Planogram Compliance)</span>
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-850/60 text-xs">
                <span className="text-neutral-300">Размещение на "Золотой полке" (уровень глаз 130-150 см):</span>
                {metrics.isGoldenShelf ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Выполнено (+35% к продажам)
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Требует улучшения
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-850/60 text-xs">
                <span className="text-neutral-300">Минимальное количество фейсингов (&gt;= 2 фейсинга):</span>
                {metrics.heroFacings >= 2 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Выполнено ({metrics.heroFacings} фейсинга)
                  </span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Недостаточно (риск невидимости)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-850/60 text-xs">
                <span className="text-neutral-300">Доля полки категории (SoS &gt;= 30%):</span>
                {metrics.shareOfShelfByFacings >= 30 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Выполнено ({metrics.shareOfShelfByFacings}%)
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Ниже норматива ({metrics.shareOfShelfByFacings}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
