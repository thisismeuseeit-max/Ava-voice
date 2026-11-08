# معماری جامع دستیار صوتی آوا (Architecture Specification)
## Ava Voice Assistant - Modular Clean Architecture & Agentic Design

### ۱. نمودار زنجیره کامل پردازش صدا (Audio Processing Pipeline)

```
[Hardware Microphone (16kHz PCM)]
         │
         ▼
[AudioSessionManager] ──── (AcousticEchoCanceler & NoiseSuppressor, AudioFocus)
         │
         ▼
[CallStateGuard] ──── (TelephonyManager: suspend immediately if CALL_STATE_RINGING or OFFHOOK)
         │
         ▼
[WakeWordEngine] ──── (Threshold checking, anti-false positive)
         │ (Wake Confirmed)
         ▼
[SpeechRecognitionEngine (STT)] ──── (Android SpeechRecognizer / Offline Vosk fallback)
         │ (Persian Transcript)
         ▼
[PersianNlpProcessor] ──── (Normalization, Colloquial grammar, Date/Time extraction)
         │ (VoiceIntent & Entities)
         ▼
[ActionSecurityGateway] ──── (Allowlist verification, Risk classification, Prompt-Injection Filter, Idempotency)
         │
    ┌────┴────────────────────────┐
    ▼                             ▼
[Low/Med Risk]              [High Risk (SMS/Delete)]
    │                             │
    ▼                             ▼
[TaskPlanner]             [User Confirmation Dialog]
    │                             │
    ▼                             ▼
[ActionExecutor] <────────────────┘
  (Dialer, SMS, Alarms, Calendar, Memory)
         │
         ▼
[ResultVerification & Audit]
         │
         ▼
[TextToSpeechEngine (TTS)] ──── (fa-IR Audio Feedback with Barge-In support)
         │
         ▼
[Return to STANDBY]
```

---

### ۲. ماشین وضعیت مرکزی (15-State Finite State Machine)

ماشین وضعیت در `core.statemachine.AssistantStateMachine` پیاده‌سازی شده و انتقال‌های زیر را به صورت Thread-Safe تضمین می‌کند:

1. **IDLE**: بدون فعالیت، منابع صوتی آزاد شده.
2. **STANDBY**: آماده‌باش برای دریافت دستور صوتی یا فشردن دکمه PTT.
3. **LISTENING_FOR_WAKE_WORD**: گوش دادن کم‌مصرف به کلمه بیدارباش.
4. **WAKE_CONFIRMED**: تأیید کلمه بیدارباش، پخش سیگنال شنیداری و انتقال به STT.
5. **LISTENING_FOR_COMMAND**: ضبط و استریم گفتار کاربر.
6. **PROCESSING_SPEECH**: تبدیل صوت به متن (Speech-to-Text).
7. **UNDERSTANDING_INTENT**: درک زبان طبیعی، تفکیک Intent و موجودیت‌ها.
8. **PLANNING_TASK**: شکستن دستور به مراحل قابل‌راستی‌آزمایی.
9. **WAITING_FOR_PERMISSION**: درخواست دسترسی سیستمی یا تأیید امنیتی کاربر.
10. **EXECUTING_TASK**: اجرای ابزار مجاز در اندروید.
11. **VERIFYING_RESULT**: بررسی نتیجه خروجی ابزار و حصول اطمینان از موفقیت.
12. **SPEAKING**: پخش پاسخ صوتی به زبان فارسی.
13. **PAUSED**: توقف خودکار به دلیل تماس ورودی/فعال یا از دست رفتن AudioFocus.
14. **ERROR**: مدیریت خطا و گزارش شفاف بدون کرش.
15. **RECOVERING**: آزادسازی منابع، خروج از وضعیت خطا و بازگشت به آماده‌باش.

---

### ۳. لایه‌های ماژولار پروژه

- **Core Layer**: شامل مدل‌های داده، ماشین وضعیت، امنیت Keystore و گارد تماس تلفنی. مستقل از فریم‌ورک‌های UI.
- **Voice Layer**: شامل مدیر نشست‌های صوتی، کنترل سخت‌افزار، حذف نویز و موتورهای STT و TTS.
- **NLP Layer**: الگوریتم‌های پردازش زبان فارسی، اصلاح حروف، نرمال‌سازی اعداد، استخراج تاریخ و ساعت نسبی.
- **Agent Layer**: برنامه‌ریز چندمرحله‌ای وظایف، دروازه امنیتی اعتبارسنجی ابزارها، و مجری ابزارهای رسمی سیستم‌عامل اندروید.
- **Memory Layer**: لایه ذخیره‌سازی داده‌های موقت، ترجیحات کاربر، وقایع و ابزار پاک‌سازی مطابق استانداردهای GDPR.
- **UI Layer**: طراحی مدرن ۳بعدی بر پایه اصول Claymorphism در Jetpack Compose (استفاده از عمق‌های نرم، سایه‌های دولایه، گوی صوتی پویا و بازخورد لمسی فیزیکی).
- **Service Layer**: سرویس مداوم Foreground Service منطبق با الزامات سخت‌گیرانه Android 14+ با اعلان اختصاصی.
