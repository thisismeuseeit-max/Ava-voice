import React, { useState } from 'react';
import { CheckCircle2, Clock, ShieldCheck, AlertTriangle, Phone, MessageSquare, Bell, Calendar, Sliders, Play } from 'lucide-react';
import { TaskPlan, TaskStep, RiskLevel } from '../core/types';
import { ActionSecurityGateway } from '../core/securityGateway';

interface TasksTabProps {
  currentPlan: TaskPlan | null;
  securityGateway: ActionSecurityGateway;
}

export const TasksTab: React.FC<TasksTabProps> = ({ currentPlan, securityGateway }) => {
  const [plans, setPlans] = useState<TaskPlan[]>([
    currentPlan || {
      taskId: 'task_demo_882',
      createdAt: Date.now() - 1000 * 60 * 5,
      rawRequest: 'به علی زنگ بزن و فردا ساعت ۸ بیدارم کن',
      intent: 'MAKE_PHONE_CALL',
      status: 'COMPLETED',
      resultSummary: 'تماس برقرار شد و زنگ هشدار برای ساعت ۸:۰۰ تنظیم گردید.',
      steps: [
        {
          id: 'step_1',
          description: 'جستجوی مخاطب علی و راستی‌آزمایی دسترسی تماس',
          tool: 'dial_number',
          parameters: { contactName: 'علی', phoneNumber: '09121234567' },
          status: 'COMPLETED',
          result: 'صفحه شماره‌گیری سیستم‌عامل اندروید باز شد.',
        },
        {
          id: 'step_2',
          description: 'تنظیم زنگ هشدار از طریق Android AlarmManager',
          tool: 'create_alarm',
          parameters: { hour: 8, minute: 0, message: 'زنگ آوا' },
          status: 'COMPLETED',
          result: 'زنگ هشدار ساعت ۸:۰۰ با موفقیت ایجاد شد.',
        },
      ],
    },
  ]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ tool: string; params: any; callback: () => void } | null>(null);
  const [lastExecutedKey, setLastExecutedKey] = useState<string | null>(null);
  const [idempotencyAlert, setIdempotencyAlert] = useState<string | null>(null);

  const simulateToolRun = (toolName: string, params: Record<string, any>, idempotencyKey: string) => {
    setIdempotencyAlert(null);
    const decision = securityGateway.validateAction(toolName, params, idempotencyKey);

    if (!decision.allowed) {
      setIdempotencyAlert(`مسدود شد: ${decision.reason}`);
      return;
    }

    if (decision.requiresUserConfirmation) {
      setPendingAction({
        tool: toolName,
        params,
        callback: () => {
          securityGateway.recordExecution(idempotencyKey);
          setLastExecutedKey(idempotencyKey);
          addNewExecutedPlan(toolName, params);
          setShowConfirmModal(false);
        },
      });
      setShowConfirmModal(true);
      return;
    }

    securityGateway.recordExecution(idempotencyKey);
    setLastExecutedKey(idempotencyKey);
    addNewExecutedPlan(toolName, params);
  };

  const addNewExecutedPlan = (toolName: string, params: any) => {
    const newPlan: TaskPlan = {
      taskId: `task_${Date.now().toString().slice(-4)}`,
      createdAt: Date.now(),
      rawRequest: `اجرای مستقیم ابزار: ${toolName}`,
      intent: toolName.toUpperCase(),
      status: 'COMPLETED',
      resultSummary: 'عملیات با نظارت کامل دروازه امنیتی با موفقیت تکمیل شد.',
      steps: [
        {
          id: `step_${Date.now()}`,
          description: `اجرای ابزار ${toolName} با پارامترهای ${JSON.stringify(params)}`,
          tool: toolName,
          parameters: params,
          status: 'COMPLETED',
          result: 'نتیجه ابزار توسط اندروید تأیید شد.',
        },
      ],
    };
    setPlans((prev) => [newPlan, ...prev]);
  };

  return (
    <div className="space-y-8 text-right">
      {/* Top Banner */}
      <div className="dark-glass-card p-6 border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="blinking-dot"></span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#39FF14]" />
              <span>موتور برنامه‌ریزی وظایف و دروازه امنیتی (Action Security Gateway)</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            هیچ خروجی مستقیمی از هوش مصنوعی روی سیستم اجرا نمی‌شود. تمام دستورات بر اساس سطح ریسک
            (کم، متوسط، بالا، غیرمجاز) سنجیده شده و در صورت نیاز تأیید صریح کاربر اخذ می‌شود.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-full bg-neutral-900 border border-white/15 text-slate-300">
            Idempotency Lock: {lastExecutedKey ? 'ACTIVE' : 'READY'}
          </span>
        </div>
      </div>

      {/* Idempotency Alert */}
      {idempotencyAlert && (
        <div className="bg-amber-950/40 border border-amber-500/40 text-amber-200 rounded-2xl p-4 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{idempotencyAlert}</span>
        </div>
      )}

      {/* Interactive Tool Execution Playground */}
      <div className="dark-glass-card p-6 border-white/10">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#39FF14]" />
          <span>اجرای زنده ابزارهای سیستم‌عامل اندروید:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dial Number */}
          <div className="p-4 bg-black/40 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 mb-2 font-bold text-sm">
                <Phone className="w-4 h-4" />
                <span>برقراری تماس (Dialer)</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                ریسک متوسط: باز کردن مستقیم Intent شماره‌گیری با مخاطب.
              </p>
            </div>
            <button
              onClick={() =>
                simulateToolRun(
                  'dial_number',
                  { contactName: 'علی رضایی', phoneNumber: '09121112233' },
                  'dial_key_ali'
                )
              }
              className="w-full py-2 bg-neutral-900 hover:bg-white hover:text-black text-slate-200 text-xs font-bold rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>تماس با علی (تست قفل تکرار)</span>
            </button>
          </div>

          {/* Send SMS */}
          <div className="p-4 bg-black/40 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-400 mb-2 font-bold text-sm">
                <MessageSquare className="w-4 h-4" />
                <span>ارسال پیامک (SMS)</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                ریسک بالا: نیازمند تأیید صریح کاربر به جهت هزینه و حریم‌خصوصی.
              </p>
            </div>
            <button
              onClick={() =>
                simulateToolRun(
                  'send_sms_draft',
                  { recipient: 'سارا احمدی', message: 'سلام، جلسه ساعت ۴ برگزار می‌شود.' },
                  `sms_key_${Date.now()}`
                )
              }
              className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>ارسال پیامک به سارا</span>
            </button>
          </div>

          {/* Set Alarm */}
          <div className="p-4 bg-black/40 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#39FF14] mb-2 font-bold text-sm">
                <Bell className="w-4 h-4" />
                <span>تنظیم زنگ هشدار (Alarm)</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                ریسک کم: تنظیم ساعت بیداری بدون ایجاد اختلال امنیتی.
              </p>
            </div>
            <button
              onClick={() =>
                simulateToolRun(
                  'create_alarm',
                  { hour: 7, minute: 30, message: 'بیداری صبحگاهی' },
                  `alarm_key_${Date.now()}`
                )
              }
              className="w-full py-2 bg-neutral-900 hover:bg-white hover:text-black text-slate-200 text-xs font-bold rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-[#39FF14]" />
              <span>تنظیم زنگ ۷:۳۰ صبح</span>
            </button>
          </div>

          {/* Calendar Event */}
          <div className="p-4 bg-black/40 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 mb-2 font-bold text-sm">
                <Calendar className="w-4 h-4" />
                <span>رویداد تقویم (Calendar)</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                ریسک کم: ثبت یادآوری جلسه از طریق تقویم بومی اندروید.
              </p>
            </div>
            <button
              onClick={() =>
                simulateToolRun(
                  'create_calendar_event',
                  { title: 'جلسه بررسی سورس کد اندروید', time: 'فردا ۱۰:۰۰' },
                  `cal_key_${Date.now()}`
                )
              }
              className="w-full py-2 bg-neutral-900 hover:bg-white hover:text-black text-slate-200 text-xs font-bold rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>ثبت رویداد فردا ساعت ۱۰</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task Plans History */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white">تاریخچه برنامه‌ها و وظایف اجراشده:</h3>
        {plans.map((plan) => (
          <div key={plan.taskId} className="dark-glass-card p-6 border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
              <div>
                <span className="font-mono text-xs text-[#39FF14] font-bold">{plan.taskId}</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{plan.rawRequest}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/80 text-[#39FF14] border border-[#39FF14]/30 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{plan.status}</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(plan.createdAt).toLocaleTimeString('fa-IR')}
                </span>
              </div>
            </div>

            {/* Steps list */}
            <div className="space-y-2">
              {plan.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="bg-black/50 border border-white/5 rounded-xl p-3 flex items-start justify-between text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-[#39FF14] flex items-center justify-center font-bold font-mono text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-200">{step.description}</span>
                      <div className="text-slate-500 font-mono mt-0.5">ابزار: {step.tool}</div>
                    </div>
                  </div>
                  <span className="text-[#39FF14] font-medium">{step.result}</span>
                </div>
              ))}
            </div>

            {plan.resultSummary && (
              <div className="text-xs text-slate-300 bg-black/40 p-3 rounded-xl border border-white/5">
                خلاصه نتیجه: {plan.resultSummary}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="dark-glass-card max-w-md w-full p-6 space-y-4 border-rose-500/30">
            <div className="flex items-center gap-3 text-rose-400 pb-3 border-b border-white/10">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-white">تأییدیه امنیتی عملیات حساس</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              آیا مایلید پیامک زیر به شماره{' '}
              <strong className="text-white">{pendingAction.params.recipient}</strong> ارسال شود؟
            </p>
            <div className="p-3 bg-black/60 rounded-xl border border-white/10 text-xs font-mono text-slate-300">
              «{pendingAction.params.message}»
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={pendingAction.callback}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-full shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                تأیید و ارسال پیامک
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
