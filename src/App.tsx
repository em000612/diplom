import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { Viewport3D } from './components/Viewport3D';
import { AnalyticsModal } from './components/AnalyticsModal';
import { AILabModal } from './components/AILabModal';
import { CheckCircle2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { toastMessage } = useStore();
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAiLabOpen, setIsAiLabOpen] = useState(false);

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Top Application Bar */}
      <TopBar
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenAiLab={() => setIsAiLabOpen(true)}
      />

      {/* Main 3D Workspace */}
      <main className="flex-1 flex w-full h-[calc(100vh-4rem)] overflow-hidden relative">
        {/* Left: Upload, 11 Package Types & SKU Library */}
        <LeftSidebar />

        {/* Center: Interactive 3D Canvas (Studio / Supermarket Shelf) */}
        <div className="flex-1 h-full relative overflow-hidden bg-neutral-950">
          <Viewport3D />
        </div>

        {/* Right: Parametric Dimensions, Materials & Merchandising Inspector */}
        <RightSidebar />
      </main>

      {/* Analytics & SoS Comparison Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* AI Lab & Packaging Vision Audit Modal */}
      <AILabModal
        isOpen={isAiLabOpen}
        onClose={() => setIsAiLabOpen(false)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel-elevated px-4 py-2.5 rounded-xl border border-indigo-500/40 text-neutral-100 text-xs font-medium flex items-center gap-2 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
