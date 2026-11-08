import React, { useState } from 'react';
import { Database, Trash2, ShieldCheck, Plus, Search, Key, Sparkles } from 'lucide-react';
import { MemoryItem } from '../core/types';

export const MemoryTab: React.FC = () => {
  const [items, setItems] = useState<MemoryItem[]>([
    {
      id: 'mem_1',
      type: 'PREFERENCE',
      key: 'ساعت کاری',
      value: 'شروع از ۹ صبح الی ۵ عصر',
      confidence: 0.98,
      timestamp: Date.now() - 1000 * 60 * 60 * 24,
      source: 'تنظیمات کاربر',
    },
    {
      id: 'mem_2',
      type: 'EPISODIC',
      key: 'محل کلیدها',
      value: 'کلید خانه روی میز کار در اتاق مطالعه قرار دارد',
      confidence: 0.95,
      timestamp: Date.now() - 1000 * 60 * 60 * 2,
      source: 'مکالمه صوتی: «یادت باشه کلیدم روی میزه»',
    },
    {
      id: 'mem_3',
      type: 'PREFERENCE',
      key: 'مخاطب اضطراری',
      value: 'علی رضایی (۰۹۱۲۱۱۱۰۰۰۰)',
      confidence: 1.0,
      timestamp: Date.now() - 1000 * 60 * 60 * 48,
      source: 'دفترچه تلفن و تنظیمات امنیتی',
    },
    {
      id: 'mem_4',
      type: 'TASK',
      key: 'جلسه بازبینی کد کاتلین',
      value: 'فردا ساعت ۱۰:۰۰ صبح',
      confidence: 0.92,
      timestamp: Date.now() - 1000 * 60 * 30,
      source: 'یادآوری تقویم',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<'PREFERENCE' | 'SHORT_TERM' | 'EPISODIC'>('PREFERENCE');

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    const newItem: MemoryItem = {
      id: `mem_${Date.now()}`,
      type: newType,
      key: newKey.trim(),
      value: newValue.trim(),
      confidence: 0.95,
      timestamp: Date.now(),
      source: 'ورودی دستی کاربر',
    };

    setItems([newItem, ...items]);
    setNewKey('');
    setNewValue('');
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const handleWipeAll = () => {
    if (confirm('آیا از امحای کامل و برگشت‌ناپذیر تمام حافظه و اطلاعات رمزنگاری‌شده اطمینان دارید؟')) {
      setItems([]);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-right">
      {/* Top Banner */}
      <div className="dark-glass-card p-6 border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="blinking-dot"></span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-[#39FF14]" />
              <span>مدیریت حافظه، حریم‌خصوصی و حق فراموشی (GDPR Compliance)</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            اطلاعات هویتی و ترجیحات با کلید سخت‌افزاری Android Keystore رمزنگاری می‌شوند. کاربر کنترل ۱۰۰٪ بر مشاهده،
            اصلاح یا حذف دائمی تمام داده‌های دستیار دارد.
          </p>
        </div>

        <button
          onClick={handleWipeAll}
          className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold rounded-full border border-rose-500/40 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>امحای کامل حافظه (Atomic Wipe)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form to add memory item (4 cols) */}
        <div className="lg:col-span-4">
          <div className="dark-glass-card p-6 border-white/10">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#39FF14]" />
              <span>ثبت مستقیم نکته یا ترجیح جدید</span>
            </h3>

            <form onSubmit={handleAddMemory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">نوع حافظه:</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                >
                  <option value="PREFERENCE">ترجیح پایدار (Long-Term Preference)</option>
                  <option value="EPISODIC">واقعه / رویداد (Episodic Memory)</option>
                  <option value="SHORT_TERM">زمینه کوتاه مدت (Short-Term Context)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">عنوان / کلید جستجو:</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="مثال: رمز عبور وای‌فای مهمان"
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-[#39FF14]/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">محتوای اطلاعات:</label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  rows={3}
                  placeholder="مثال: وای‌فای مهمان office_guest با رمز 987654321 است"
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-[#39FF14]/50"
                />
              </div>

              <button
                type="submit"
                className="loopstack-btn-neon w-full justify-center text-xs font-bold cursor-pointer"
              >
                ذخیره در حافظه رمزنگاری‌شده
              </button>
            </form>
          </div>
        </div>

        {/* List of remembered items (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="dark-glass-card p-4 border-white/10 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در کلیدها و محتویات حافظه..."
              className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-mono shrink-0">
              {filteredItems.length} رکورد
            </span>
          </div>

          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="dark-glass-card p-12 text-center text-slate-500 text-xs border-white/10">
                هیچ اطلاعاتی در حافظه یافت نشد.
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="dark-glass-card p-5 border-white/10 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.key}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.type === 'PREFERENCE'
                            ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                            : item.type === 'EPISODIC'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleDateString('fa-IR')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{item.value}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 text-[#39FF14]">
                        <Key className="w-3 h-3" />
                        <span>Keystore AES-256 GCM</span>
                      </span>
                      <span>·</span>
                      <span>منبع: {item.source}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="حذف این رکورد"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
