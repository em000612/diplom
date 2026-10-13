import React from 'react';
import { useStore } from '../context/StoreContext';
import { DEMO_PRESETS } from '../utils/constants';
import {
  Box,
  Layers,
  BarChart3,
  Sparkles,
  Share2,
  FileSpreadsheet,
  Package,
  Store,
  ChevronDown,
} from 'lucide-react';

interface TopBarProps {
  onOpenAnalytics: () => void;
  onOpenAiLab: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenAnalytics, onOpenAiLab }) => {
  const {
    viewMode,
    setViewMode,
    activePresetId,
    loadPreset,
    showToast,
    runAiAudit,
    isAiAuditing,
  } = useStore();

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Ссылка на проект скопирована в буфер обмена!');
  };

  const handleExportPlanogram = () => {
    window.print();
  };

  return (
    <header className="h-16 w-full glass-panel border-b border-neutral-800/80 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              ShelfCraft <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">3D PRO</span>
            </h1>
          </div>
          <p className="text-[11px] text-neutral-400">Интернет-мерчендайзинг &amp; Визуализация полок</p>
        </div>
      </div>

      {/* Main View Mode Navigation Tabs */}
      <div className="flex items-center bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 shadow-inner">
        <button
          onClick={() => setViewMode('studio')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            viewMode === 'studio'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>3D Редактор Упаковки</span>
        </button>

        <button
          onClick={() => setViewMode('shelf')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            viewMode === 'shelf'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Виртуальная Полка</span>
        </button>

        <button
          onClick={() => {
            setViewMode('shelf');
            onOpenAnalytics();
          }}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-all"
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Аналитика &amp; SoS</span>
        </button>

        <button
          onClick={() => {
            onOpenAiLab();
          }}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 text-neutral-400 hover:text-purple-300 hover:bg-purple-950/30 transition-all"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI Аудит &amp; Дизайн</span>
        </button>
      </div>

      {/* Right Controls: Category Preset Selector & Actions */}
      <div className="flex items-center gap-3">
        {/* Preset Selector */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-neutral-400 hidden xl:inline">Пресет категории:</label>
          <div className="relative">
            <select
              value={activePresetId}
              onChange={(e) => loadPreset(e.target.value)}
              className="glass-input text-xs font-medium text-neutral-200 rounded-lg px-3 py-1.5 pr-8 appearance-none cursor-pointer focus:outline-none"
            >
              {DEMO_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-neutral-900 text-neutral-200">
                  {preset.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Quick AI Audit Button */}
        <button
          onClick={runAiAudit}
          disabled={isAiAuditing}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAiAuditing ? 'AI Аудит...' : 'Экспресс-аудит'}</span>
        </button>

        {/* Planogram PDF Export */}
        <button
          onClick={handleExportPlanogram}
          className="p-2 rounded-lg glass-panel text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Печать планограммы / PDF"
        >
          <FileSpreadsheet className="w-4 h-4" />
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-2 rounded-lg glass-panel text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Скопировать ссылку"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
