import React from 'react';
import { Download, Sparkles, Terminal } from 'lucide-react';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadProject: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onDownloadProject,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-neutral-900 border border-white/20 flex items-center justify-center text-white font-serif font-bold text-base shadow-inner relative">
          <span className="text-[#39FF14] text-xs absolute -top-0.5 -right-0.5">
            <span className="blinking-dot"></span>
          </span>
          آ
        </div>
        <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 font-sans">
          آوا <span className="text-slate-500 font-light mx-1">·</span> دستیار هوشمند صوتی
        </span>
      </div>

      {/* Zone 2: 4–5 nav links, 1–2 word labels, single-line */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('assistant')}
          className={`transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'assistant'
              ? 'text-white font-bold border-b-2 border-[#39FF14] pb-1 shadow-xs'
              : 'hover:text-slate-200'
          }`}
        >
          دستیار صوتی
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'tasks'
              ? 'text-white font-bold border-b-2 border-[#39FF14] pb-1 shadow-xs'
              : 'hover:text-slate-200'
          }`}
        >
          ابزارها و وظایف
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          className={`transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'memory'
              ? 'text-white font-bold border-b-2 border-[#39FF14] pb-1 shadow-xs'
              : 'hover:text-slate-200'
          }`}
        >
          حافظه و حریم‌خصوصی
        </button>

        <button
          onClick={() => setActiveTab('agent')}
          className={`transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'agent'
              ? 'text-white font-bold border-b-2 border-[#39FF14] pb-1 shadow-xs'
              : 'hover:text-slate-200'
          }`}
        >
          سورس کاتلین & Agent
        </button>

        <button
          onClick={() => setActiveTab('bench')}
          className={`transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'bench'
              ? 'text-white font-bold border-b-2 border-[#39FF14] pb-1 shadow-xs'
              : 'hover:text-slate-200'
          }`}
        >
          آزمایشگاه NLP و Recharts
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onDownloadProject}
          className="loopstack-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[#39FF14]" />
          <span>دانلود سورس کاتلین</span>
          <span className="blinking-dot"></span>
        </button>
      </div>
    </header>
  );
};
