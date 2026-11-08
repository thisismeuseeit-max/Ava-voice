import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneCall, PhoneOff, Volume2, ShieldAlert, Sparkles, Send, Play } from 'lucide-react';
import { AssistantState, CallState, VoiceIntent } from '../core/types';
import { AssistantStateMachine } from '../core/stateMachine';
import { parsePersianIntent } from '../core/persianNlp';

interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  intent?: VoiceIntent;
}

interface VoiceAssistantTabProps {
  stateMachine: AssistantStateMachine;
  onExecuteIntent: (intent: VoiceIntent) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const VoiceAssistantTab: React.FC<VoiceAssistantTabProps> = ({
  stateMachine,
  onExecuteIntent,
  messages,
  setMessages,
}) => {
  const [currentState, setCurrentState] = useState<AssistantState>(stateMachine.getState());
  const [callState, setCallState] = useState<CallState>(stateMachine.getCallState());
  const [typedInput, setTypedInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const unsub = stateMachine.subscribe((state) => {
      setCurrentState(state);
    });
    return unsub;
  }, [stateMachine]);

  // Speech Recognition setup (Web Speech API with Persian fa-IR)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fa-IR';

      recognition.onstart = () => {
        setIsListening(true);
        stateMachine.transition('LISTENING_FOR_COMMAND', 'Microphone active');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleUserQuery(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          stateMachine.transition('ERROR', event.error);
          setTimeout(() => stateMachine.reset(), 1500);
        } else {
          stateMachine.reset();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechRecognitionSupported(false);
    }
  }, [stateMachine]);

  const speakPersianText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fa-IR';
      utterance.rate = 0.95;
      utterance.onstart = () => {
        stateMachine.transition('SPEAKING', 'TTS started');
      };
      utterance.onend = () => {
        stateMachine.transition('STANDBY', 'TTS finished');
      };
      utterance.onerror = () => {
        stateMachine.transition('STANDBY', 'TTS error');
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleUserQuery = (query: string) => {
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    stateMachine.transition('PROCESSING_SPEECH');

    setTimeout(() => {
      stateMachine.transition('UNDERSTANDING_INTENT');
      const intent = parsePersianIntent(query);

      let reply = 'متوجه درخواست شما شدم.';
      if (intent.intent === 'MAKE_PHONE_CALL') {
        const contact = intent.entities.contactName || 'مخاطب';
        reply = `در حال آماده‌سازی تماس با ${contact}...`;
      } else if (intent.intent === 'SEND_SMS') {
        const recipient = intent.entities.recipient || 'گیرنده';
        reply = `پیش‌نویس پیامک برای ${recipient} آماده شد. لطفاً ارسال را تأیید فرمایید.`;
      } else if (intent.intent === 'SET_ALARM') {
        const h = intent.entities.hour;
        const m = intent.entities.minute || 0;
        reply = `زنگ هشدار برای ساعت ${h}:${m < 10 ? '0' + m : m} تنظیم شد.`;
      } else if (intent.intent === 'REMEMBER_INFO') {
        reply = 'اطلاعات در حافظه امن با موفقیت ثبت شد.';
      } else if (intent.intent === 'RECALL_INFO') {
        reply = 'بررسی حافظه: کلیدهای شما طبق آخرین ثبت، روی میز کار قرار دارند.';
      } else {
        reply = 'درخواست شما در لایه امنیتی بررسی و ثبت گردید.';
      }

      const assistantMsg: Message = {
        id: `msg_${Date.now()}_a`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        intent,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      onExecuteIntent(intent);
      speakPersianText(reply);
    }, 400);
  };

  const toggleMic = () => {
    if (callState !== 'IDLE') {
      alert('به دلیل فعال بودن تماس تلفنی، میکروفون جهت جلوگیری از تداخل صوتی قفل است.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      stateMachine.reset();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Recognition start caught:', e);
        }
      } else {
        const sampleQuery = 'فردا ساعت ۸ صبح بیدارم کن';
        handleUserQuery(sampleQuery);
      }
    }
  };

  const toggleCallState = () => {
    if (callState === 'IDLE') {
      stateMachine.handleCallStateChange('RINGING');
      setCallState('RINGING');
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          sender: 'system',
          text: 'تماس تلفنی ورودی آغاز شد (CALL_STATE_RINGING) — میکروفون و بیدارباش آوا به حالت تعلیق (PAUSED) درآمد تا مکالمه تلفنی به دستور اشتباهی تبدیل نشود.',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else {
      stateMachine.handleCallStateChange('IDLE');
      setCallState('IDLE');
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          sender: 'system',
          text: 'تماس تلفنی پایان یافت (CALL_STATE_IDLE) — منابع آزاد شده و آوا مجدداً در حالت آماده‌باش (STANDBY) قرار گرفت.',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const quickSamples = [
    'به علی زنگ بزن',
    'به سارا پیام بده که دیر میرسم',
    'فردا ساعت ۸ صبح بیدارم کن',
    'دو ساعت دیگه یادآوری کن',
    'یادت باشه کلیدم روی میزه',
    'کلیدم کجاست؟',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Loopstack Dark 3D Voice Orb & Status (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="dark-glass-card p-8 text-center relative overflow-hidden flex flex-col items-center">
          {/* Top Status Bar with Neon Accents */}
          <div className="w-full flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="blinking-dot"></span>
              <span className="text-xs font-semibold text-slate-400">وضعیت ماشین وضعیت:</span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                  currentState === 'STANDBY'
                    ? 'bg-white/10 text-slate-200'
                    : currentState === 'LISTENING_FOR_COMMAND'
                    ? 'bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/40 animate-pulse'
                    : currentState === 'PROCESSING_SPEECH' || currentState === 'UNDERSTANDING_INTENT'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    : currentState === 'EXECUTING_TASK'
                    ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                    : currentState === 'SPEAKING'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    : currentState === 'PAUSED'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/40 font-bold'
                    : 'bg-white/10 text-white'
                }`}
              >
                {currentState}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">وضعیت خط تلفن:</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  callState === 'IDLE'
                    ? 'bg-emerald-950/70 text-[#39FF14] border border-[#39FF14]/30'
                    : 'bg-rose-950/70 text-rose-400 border border-rose-500/40'
                }`}
              >
                {callState === 'IDLE' ? 'آزاد (امن)' : 'تماس فعال (سایلنت)'}
              </span>
            </div>
          </div>

          {/* Loopstack 3D Cosmic Void Voice Orb */}
          <div className="my-10 flex flex-col items-center">
            <div
              onClick={toggleMic}
              className={`w-48 h-48 rounded-full cursor-pointer flex items-center justify-center transition-all duration-500 relative select-none ${
                callState !== 'IDLE'
                  ? 'bg-gradient-to-tr from-neutral-900 to-neutral-800 border border-rose-500/30 opacity-70'
                  : isListening
                  ? 'bg-gradient-to-tr from-neutral-950 via-emerald-950 to-neutral-900 border border-[#39FF14]/60 orb-loopstack-listening'
                  : currentState === 'SPEAKING'
                  ? 'bg-gradient-to-tr from-neutral-950 via-amber-950 to-neutral-900 border border-amber-500/50 shadow-2xl shadow-amber-500/20'
                  : 'bg-gradient-to-tr from-neutral-950 via-neutral-900 to-black border border-white/15 shadow-2xl shadow-emerald-500/10 hover:border-[#39FF14]/40 hover:scale-105 active:scale-95'
              }`}
            >
              {/* Inner glowing core with ripple */}
              <div className="w-36 h-36 rounded-full bg-gradient-to-b from-white/10 to-black/40 flex items-center justify-center backdrop-blur-md border border-white/5 relative">
                {isListening && (
                  <span className="absolute inset-0 rounded-full border border-[#39FF14]/30 animate-ping"></span>
                )}
                {callState !== 'IDLE' ? (
                  <PhoneOff className="w-12 h-12 text-rose-400/90" />
                ) : isListening ? (
                  <Mic className="w-12 h-12 text-[#39FF14] animate-pulse" />
                ) : (
                  <Mic className="w-12 h-12 text-white/90 drop-shadow-lg" />
                )}
              </div>
            </div>

            <p className="mt-6 text-sm font-semibold text-slate-200">
              {callState !== 'IDLE'
                ? 'مکالمه تلفنی فعال است — سنسور بیدارباش به صورت خودکار معلق گردید.'
                : isListening
                ? 'در حال شنیدن صدای شما به زبان فارسی...'
                : 'برای صحبت لمس کنید، یا کلمه بیدارباش «آوا» را بگویید'}
            </p>
            <span className="text-xs text-slate-500 mt-1">
              مجهز به فیلتر سخت‌افزاری حذف اکو (AEC)، کاهش نویز محیطی و مانیتورینگ صوتی
            </span>
          </div>

          {/* Call Interference Guard Simulator */}
          <div className="w-full bg-neutral-950/80 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div className="text-right">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#39FF14]" />
                <span>شبیه‌ساز گارد ایمنی تماس تلفنی (بند ۴.۴ سند)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                تست محافظت در برابر بیدار شدن ناخواسته دستیار حین تماس ورودی یا مکالمه
              </p>
            </div>

            <button
              onClick={toggleCallState}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                callState === 'IDLE'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40 hover:bg-rose-900/60'
                  : 'bg-emerald-950 text-[#39FF14] border border-[#39FF14]/40 hover:bg-emerald-900/60'
              }`}
            >
              {callState === 'IDLE' ? (
                <>
                  <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                  <span>شبیه‌سازی زنگ تماس</span>
                </>
              ) : (
                <>
                  <PhoneOff className="w-3.5 h-3.5 text-[#39FF14]" />
                  <span>پایان تماس (آزادسازی)</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Persian Prompt Pills */}
          <div className="w-full mt-6 text-right">
            <span className="text-xs font-medium text-slate-400 block mb-2">
              آزمون سریع جملات گفتاری و عامیانه فارسی:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickSamples.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUserQuery(sample)}
                  className="px-3.5 py-1.5 bg-neutral-900/90 text-slate-300 text-xs font-medium rounded-full border border-white/10 hover:border-[#39FF14]/50 hover:text-white transition-all cursor-pointer shadow-xs"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Dark Glass Conversation & Intent Stream (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="dark-glass-card p-6 flex flex-col h-[620px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#39FF14]" />
              <span>جریان تعامل صوتی و استخراج Intent</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{messages.length} پیام</span>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user'
                    ? 'items-start'
                    : msg.sender === 'assistant'
                    ? 'items-end'
                    : 'items-center'
                }`}
              >
                {msg.sender === 'system' ? (
                  <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-200 text-center max-w-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-sm shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-neutral-800 text-white border border-white/15 rounded-br-xs'
                        : 'bg-neutral-950 text-slate-200 border border-white/10 rounded-bl-xs'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>

                    {/* Extracted Intent Badge if assistant parsed it */}
                    {msg.intent && (
                      <div className="mt-2 pt-2 border-t border-white/10 text-xs text-slate-400 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-cyan-400 font-semibold">
                            {msg.intent.intent}
                          </span>
                          <span className="text-[#39FF14] font-medium font-mono">
                            دقت: {Math.round(msg.intent.confidence * 100)}%
                          </span>
                        </div>
                        {msg.intent.requiredPermission && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            مجوز: {msg.intent.requiredPermission}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'assistant' && (
                        <button
                          onClick={() => speakPersianText(msg.text)}
                          className="hover:text-[#39FF14] transition-colors flex items-center gap-1 cursor-pointer"
                          title="پخش مجدد صدا"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Text Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserQuery(typedInput);
              setTypedInput('');
            }}
            className="pt-3 border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="دستور صوتی یا متنی خود را بنویسید..."
              className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/30"
            />
            <button
              type="submit"
              disabled={!typedInput.trim()}
              className="px-4 py-2.5 bg-neutral-900 border border-white/20 text-[#39FF14] rounded-xl hover:bg-[#39FF14] hover:text-black disabled:opacity-30 transition-all shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
