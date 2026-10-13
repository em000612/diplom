import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Layers,
  FileText,
  RotateCw,
} from 'lucide-react';

interface AILabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AILabModal: React.FC<AILabModalProps> = ({ isOpen, onClose }) => {
  const {
    selectedSku,
    aiAuditResult,
    runAiAudit,
    isAiAuditing,
    updateSelectedSku,
    showToast,
  } = useStore();

  const [activeSideTab, setActiveSideTab] = useState<'back' | 'side' | 'top'>('back');
  const [isGeneratingSide, setIsGeneratingSide] = useState<boolean>(false);
  const [generatedSideData, setGeneratedSideData] = useState<any>(null);

  if (!isOpen) return null;

  // Handle generating missing packaging sides with AI
  const handleGenerateSide = async () => {
    setIsGeneratingSide(true);
    try {
      const res = await fetch('/api/ai/generate-texture-side', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: selectedSku?.brand,
          productName: selectedSku?.name,
          sideType: activeSideTab,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedSideData(data);
        showToast('Текстура обратной стороны упаковки сгенерирована AI!');
      }
    } catch (err) {
      showToast('Ошибка генерации стороны');
    } finally {
      setIsGeneratingSide(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel-elevated w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-purple-500/30 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Лаборатория Упаковки &amp; Нейро-мерчендайзинг</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                  Gemini Flash Vision
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Анализ заметности с дистанции 1.5м, рекомендации по улучшению дизайна и синтез недостающих сторон
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAiAudit}
              disabled={isAiAuditing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAiAuditing ? 'animate-spin' : ''}`} />
              <span>{isAiAuditing ? 'Анализирую упаковку...' : 'Запустить AI аудит'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: Visual Radar & Scorecard */}
          {aiAuditResult ? (
            <div className="space-y-6">
              {/* Score Badges */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block mb-1">Читаемость (1.5 - 2м)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-purple-400">
                      {aiAuditResult.readabilityScore}
                    </span>
                    <span className="text-xs text-neutral-500">/ 100</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${aiAuditResult.readabilityScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block mb-1">Цветовой контраст полки</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-indigo-400">
                      {aiAuditResult.shelfContrastScore}
                    </span>
                    <span className="text-xs text-neutral-500">/ 100</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${aiAuditResult.shelfContrastScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block mb-1">Сила бренд-блока</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-pink-400">
                      {aiAuditResult.shelfBlockingScore}
                    </span>
                    <span className="text-xs text-neutral-500">/ 100</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-pink-500 h-full rounded-full"
                      style={{ width: `${aiAuditResult.shelfBlockingScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block mb-1">Индекс заметности (AI)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {aiAuditResult.overallVisibilityIndex}
                    </span>
                    <span className="text-xs text-neutral-500">/ 100</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${aiAuditResult.overallVisibilityIndex}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Сильные стороны дизайна</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {aiAuditResult.keyStrengths.map((str, idx) => (
                      <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Vulnerabilities */}
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Зоны риска на полке супермаркета</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {aiAuditResult.criticalFlaws.map((flaw, idx) => (
                      <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{flaw}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2.5">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-indigo-400" />
                  <span>Рекомендации бренд-менеджеру и дизайнеру упаковки</span>
                </h4>
                <div className="space-y-2">
                  {aiAuditResult.actionableRecommendations.map((rec, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-200 flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
                {aiAuditResult.goldenShelfAdvice && (
                  <p className="text-xs text-amber-300/90 italic pt-2 border-t border-indigo-500/20">
                    ★ Совет по Золотой полке: {aiAuditResult.goldenShelfAdvice}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-neutral-800 text-center space-y-3 bg-neutral-900/40">
              <Cpu className="w-10 h-10 mx-auto text-purple-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">AI-аудит еще не сформирован</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Нажмите кнопку &quot;Запустить AI аудит&quot;, чтобы оценить читаемость этикетки, цветовой контраст и заметность среди конкурентов на полке.
              </p>
              <button
                onClick={runAiAudit}
                disabled={isAiAuditing}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Запустить анализ сейчас</span>
              </button>
            </div>
          )}

          {/* SECTION 2: AI Missing Sides Synthesis */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Генерация недостающих сторон упаковки (AI Texture Synthesis)</span>
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Если у вас есть только фронтальное фото, AI автоматически синтезирует оборотную сторону (КБЖУ, штрихкод, состав)
                </p>
              </div>

              <div className="flex items-center gap-1 bg-neutral-800 p-0.5 rounded-lg border border-neutral-700">
                <button
                  onClick={() => setActiveSideTab('back')}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    activeSideTab === 'back' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400'
                  }`}
                >
                  Оборотная (КБЖУ)
                </button>
                <button
                  onClick={() => setActiveSideTab('side')}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    activeSideTab === 'side' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400'
                  }`}
                >
                  Боковая (Состав)
                </button>
                <button
                  onClick={() => setActiveSideTab('top')}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    activeSideTab === 'top' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400'
                  }`}
                >
                  Крышка / Топ
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateSide}
                disabled={isGeneratingSide}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>{isGeneratingSide ? 'Синтезирую данные...' : 'Сгенерировать сторону с AI'}</span>
              </button>

              {generatedSideData && (
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Штрихкод {generatedSideData.barcode} и таблица КБЖУ созданы</span>
                </div>
              )}
            </div>

            {generatedSideData && (
              <div className="p-3 rounded-lg bg-neutral-850 border border-neutral-750 text-xs text-neutral-300 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>Энергетическая ценность:</span>
                  <span className="font-bold text-white">{generatedSideData.nutritionTable?.calories}</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Белки: {generatedSideData.nutritionTable?.proteins}</span>
                  <span>Жиры: {generatedSideData.nutritionTable?.fats}</span>
                  <span>Углеводы: {generatedSideData.nutritionTable?.carbs}</span>
                </div>
                <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
                  Состав: {generatedSideData.composition}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
