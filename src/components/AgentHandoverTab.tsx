import React, { useState } from 'react';
import { FileCode, Download, Copy, Check, Terminal, FolderTree, BookOpen, ExternalLink, Cpu } from 'lucide-react';
import { ANDROID_FILES_CATALOG, AndroidSourceFile } from '../data/androidFiles';

export const AgentHandoverTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidSourceFile>(ANDROID_FILES_CATALOG[0]);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFiles = activeCategory === 'ALL'
    ? ANDROID_FILES_CATALOG
    : ANDROID_FILES_CATALOG.filter((f) => f.category === activeCategory);

  const categories = [
    { id: 'ALL', label: 'همه فایل‌ها' },
    { id: 'DOCS', label: 'مستندات بیلد' },
    { id: 'CONFIG', label: 'گرادل و مانیفست' },
    { id: 'CORE', label: 'هسته و امنیت' },
    { id: 'NLP', label: 'پردازش زبان' },
    { id: 'VOICE', label: 'صوت و گارد تماس' },
    { id: 'UI', label: 'طراحی رابط' },
  ];

  return (
    <div className="space-y-8 text-right">
      {/* Top Banner: Agent Handover Overview */}
      <div className="dark-glass-card p-6 border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="blinking-dot"></span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#39FF14]" />
              <span>بسته کامل تحویل سورس کد اندروید به هوش مصنوعی (Agent Handover)</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            این بخش به طور اختصاصی جهت ارجاع سورس به یک هوش مصنوعی یا توسعه‌دهنده برای بررسی، کامپایل، تست و ایجاد فایل
            APK آماده شده است. تمام فایل‌های مورد نیاز Gradle، کاتلین، مانیفست و اسکریپت‌های تست در دسترس است.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-neutral-900 border border-[#39FF14]/30 text-[#39FF14]">
            Android 14 (API 34) · Kotlin 2.0 · Jetpack Compose
          </span>
        </div>
      </div>

      {/* Terminal Command Quick Reference for Agent */}
      <div className="bg-black/90 text-slate-100 rounded-2xl p-5 shadow-2xl border border-white/10 font-mono text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#39FF14]" />
            <span className="text-white font-bold">دستورات خط فرمان گرادل برای Agent کامپایل‌کننده:</span>
          </div>
          <span className="text-[11px] text-slate-500">Root Directory: /android</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1" dir="ltr">
          <div className="bg-neutral-950 p-3 rounded-xl border border-white/5 text-left">
            <span className="text-slate-400 block text-[11px] mb-1 font-sans" dir="rtl">۱. اجرای تست‌های خودکار:</span>
            <code className="text-[#39FF14] font-bold select-all block text-xs">./gradlew test</code>
          </div>
          <div className="bg-neutral-950 p-3 rounded-xl border border-white/5 text-left">
            <span className="text-slate-400 block text-[11px] mb-1 font-sans" dir="rtl">۲. کامپایل نسخه Debug APK:</span>
            <code className="text-[#39FF14] font-bold select-all block text-xs">./gradlew assembleDebug</code>
          </div>
          <div className="bg-neutral-950 p-3 rounded-xl border border-white/5 text-left">
            <span className="text-slate-400 block text-[11px] mb-1 font-sans" dir="rtl">۳. نصب و استقرار با ADB:</span>
            <code className="text-[#39FF14] font-bold select-all block text-xs">adb install -r app-debug.apk</code>
          </div>
        </div>
      </div>

      {/* Source Code Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: File Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-black/60 rounded-2xl border border-white/10">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeCategory === c.id
                    ? 'bg-white/15 text-[#39FF14] font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="dark-glass-card p-3 max-h-[550px] overflow-y-auto space-y-1.5 border-white/10">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <div
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`p-3 rounded-xl cursor-pointer transition-all text-right ${
                    isSelected
                      ? 'bg-neutral-900 border border-[#39FF14]/50 text-white shadow-sm'
                      : 'bg-black/40 hover:bg-neutral-900 text-slate-300 border border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate max-w-[200px]" dir="ltr">
                      {file.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'bg-white/5 text-slate-500'
                      }`}
                    >
                      {file.language}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 line-clamp-1 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {file.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Code Viewer & Actions (8 cols) */}
        <div className="lg:col-span-8">
          <div className="dark-glass-card p-6 flex flex-col h-[600px] border-white/10">
            {/* Header with copy & metadata */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#39FF14]" />
                  <span className="font-mono text-xs font-bold text-white" dir="ltr">
                    {selectedFile.path}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-white/15 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#39FF14]" />
                      <span className="text-[#39FF14]">کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی سورس</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="flex-1 overflow-auto bg-black text-slate-200 p-4 rounded-xl font-mono text-xs leading-relaxed my-4 border border-white/10" dir="ltr">
              <pre>
                <code>{selectedFile.content}</code>
              </pre>
            </div>

            {/* Bottom info */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/10 font-mono">
              <span>LANGUAGE: {selectedFile.language.toUpperCase()}</span>
              <span>
                LINES: {selectedFile.content.split('\n').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
