/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { TopBar } from './components/TopBar';
import { VoiceAssistantTab } from './components/VoiceAssistantTab';
import { TasksTab } from './components/TasksTab';
import { MemoryTab } from './components/MemoryTab';
import { AgentHandoverTab } from './components/AgentHandoverTab';
import { NlpBenchTab } from './components/NlpBenchTab';
import { AssistantStateMachine } from './core/stateMachine';
import { ActionSecurityGateway } from './core/securityGateway';
import { VoiceIntent, TaskPlan } from './core/types';
import { ANDROID_FILES_CATALOG } from './data/androidFiles';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('assistant');

  // Shared Core Instances
  const stateMachine = useMemo(() => new AssistantStateMachine('STANDBY'), []);
  const securityGateway = useMemo(() => new ActionSecurityGateway(), []);

  // Shared State
  const [currentPlan, setCurrentPlan] = useState<TaskPlan | null>(null);
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'init_welcome',
      sender: 'assistant',
      text: 'درود! من «آوا» هستم؛ دستیار صوتی و شخصی اندروید شما. برای گفتگو، دکمه میکروفون را لمس کنید یا فرمان خود را بنویسید.',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleExecuteIntent = (intent: VoiceIntent) => {
    const plan: TaskPlan = {
      taskId: `task_${Date.now().toString().slice(-4)}`,
      createdAt: Date.now(),
      rawRequest: intent.rawQuery,
      intent: intent.intent,
      status: 'RUNNING',
      steps: [
        {
          id: `step_${Date.now()}_1`,
          description: `برنامه‌ریزی دستور ${intent.intent}`,
          tool: intent.intent === 'MAKE_PHONE_CALL' ? 'dial_number' : intent.intent === 'SEND_SMS' ? 'send_sms_draft' : 'create_alarm',
          parameters: intent.entities,
          status: 'RUNNING',
        },
      ],
    };

    setCurrentPlan(plan);
  };

  const handleDownloadFullProject = () => {
    let bundle = `================================================================================\n`;
    bundle += `پروژه دستیار صوتی هوشمند اندروید «آوا» (Ava Voice Assistant v1.0.0)\n`;
    bundle += `مستندات و سورس کامل جهت کامپایل توسط هوش مصنوعی (Agent) یا توسعه‌دهنده\n`;
    bundle += `تاریخ ایجاد: ${new Date().toISOString()}\n`;
    bundle += `================================================================================\n\n`;

    for (const file of ANDROID_FILES_CATALOG) {
      bundle += `\n################################################################################\n`;
      bundle += `FILE: ${file.path}\n`;
      bundle += `DESCRIPTION: ${file.description}\n`;
      bundle += `################################################################################\n\n`;
      bundle += file.content + `\n\n`;
    }

    const blob = new Blob([bundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Ava_Android_Voice_Assistant_Source_Package.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 flex flex-col font-sans selection:bg-[#39FF14] selection:text-black relative overflow-x-hidden">
      {/* Loopstack Top Ambient Radial Glow */}
      <div
        className="pointer-events-none fixed -top-[25vw] left-1/2 -translate-x-1/2 w-[85vw] h-[45vw] rounded-full blur-[140px] opacity-25 bg-gradient-to-b from-[#39FF14] via-indigo-900 to-transparent z-0"
        aria-hidden="true"
      />

      {/* Top Bar with 3-Zone Contract */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadProject={handleDownloadFullProject}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 relative z-10">
        {activeTab === 'assistant' && (
          <VoiceAssistantTab
            stateMachine={stateMachine}
            onExecuteIntent={handleExecuteIntent}
            messages={messages}
            setMessages={setMessages}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksTab
            currentPlan={currentPlan}
            securityGateway={securityGateway}
          />
        )}

        {activeTab === 'memory' && <MemoryTab />}

        {activeTab === 'agent' && <AgentHandoverTab />}

        {activeTab === 'bench' && <NlpBenchTab />}
      </main>

      {/* Loopstack-Inspired Subtle Footer */}
      <footer className="border-t border-white/10 bg-black/60 backdrop-blur-md py-6 px-6 text-center text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="blinking-dot"></span>
            <span className="font-mono text-slate-300">
              Ava Voice Engine v1.0.0 · Ready for Agent Gradle Build (API 34)
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]" dir="ltr">
            <span>KOTLIN 2.0</span>
            <span>·</span>
            <span>JETPACK COMPOSE</span>
            <span>·</span>
            <span>RECHARTS 2.x</span>
            <span>·</span>
            <span>OWASP MASVS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
