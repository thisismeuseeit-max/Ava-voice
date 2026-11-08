import { VoiceIntent, RiskLevel } from './types';

/**
 * Normalizes Persian and Arabic text:
 * Converts Arabic Yeh and Kaf, removes excessive diacritics, and converts Persian/Arabic numerals to English digits.
 */
export function normalizePersianText(input: string): string {
  if (!input) return '';
  let text = input.trim();

  // Arabic characters to Persian
  text = text.replace(/ي/g, 'ی');
  text = text.replace(/ك/g, 'ک');
  text = text.replace(/ة/g, 'ه');
  text = text.replace(/ؤ/g, 'و');
  text = text.replace(/إ|أ|آ/g, 'ا');

  // Convert Persian numbers to English numbers
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  for (let i = 0; i < 10; i++) {
    text = text.replace(new RegExp(persianNumbers[i], 'g'), i.toString());
    text = text.replace(new RegExp(arabicNumbers[i], 'g'), i.toString());
  }

  // Remove zero-width non-joiner normalization if standalone or replace with standard space
  text = text.replace(/\u200c/g, ' ');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ');

  return text.toLowerCase();
}

/**
 * Extracts relative date and time from Persian queries
 */
export function extractPersianDateTime(query: string): {
  dateDescription?: string;
  hour?: number;
  minute?: number;
  relativeHours?: number;
  relativeDays?: number;
} {
  const norm = normalizePersianText(query);
  const result: {
    dateDescription?: string;
    hour?: number;
    minute?: number;
    relativeHours?: number;
    relativeDays?: number;
  } = {};

  // Relative days
  if (norm.includes('امروز')) {
    result.relativeDays = 0;
    result.dateDescription = 'امروز';
  } else if (norm.includes('فردا')) {
    result.relativeDays = 1;
    result.dateDescription = 'فردا';
  } else if (norm.includes('پس فردا')) {
    result.relativeDays = 2;
    result.dateDescription = 'پس‌فردا';
  }

  // Relative hours: e.g. "دو ساعت دیگه", "2 ساعت بعد", "نیم ساعت دیگه"
  const relHourMatch = norm.match(/(\d+|یک|دو|سه|چهار|پنج|نیم)\s*(ساعت|دقیقه)\s*(دیگه|بعد)/);
  if (relHourMatch) {
    const valStr = relHourMatch[1];
    const unit = relHourMatch[2];
    let num = 1;
    if (valStr === 'نیم') num = 0.5;
    else if (valStr === 'یک') num = 1;
    else if (valStr === 'دو') num = 2;
    else if (valStr === 'سه') num = 3;
    else if (valStr === 'چهار') num = 4;
    else if (valStr === 'پنج') num = 5;
    else {
      const parsed = parseInt(valStr, 10);
      if (!isNaN(parsed)) num = parsed;
    }

    if (unit === 'ساعت') {
      result.relativeHours = num;
      result.dateDescription = `${num} ساعت دیگر`;
    } else {
      result.minute = num;
      result.dateDescription = `${num} دقیقه دیگر`;
    }
  }

  // Clock time: e.g. "ساعت ۸", "ساعت 8 و نیم", "ساعت 5 عصر", "ساعت 9 صبح"
  const timeMatch = norm.match(/ساعت\s*(\d+)(?:\s*(و نیم|:(\d+)))?\s*(صبح|عصر|شب|ظهر)?/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    let minute = 0;
    if (timeMatch[2]?.includes('نیم')) {
      minute = 30;
    } else if (timeMatch[3]) {
      minute = parseInt(timeMatch[3], 10);
    }

    const period = timeMatch[4];
    if ((period === 'عصر' || period === 'شب') && hour < 12) {
      hour += 12;
    } else if (period === 'صبح' && hour === 12) {
      hour = 0;
    }

    result.hour = hour;
    result.minute = minute;
  }

  return result;
}

/**
 * Persian Intent & Slot Extraction
 */
export function parsePersianIntent(rawQuery: string): VoiceIntent {
  const normalized = normalizePersianText(rawQuery);

  // 1. Phone Call Intent: "به علی زنگ بزن", "تماس با سارا", "با رضا تماس بگیر"
  const callMatch = normalized.match(/(?:تماس\s+با|به|با)\s+([^\s]+)\s*(?:زنگ\s+بزن|تماس\s+بگیر)/) ||
                    normalized.match(/زنگ\s+بزن\s+به\s+([^\s]+)/);
  if (callMatch || normalized.includes('تماس بگیر') || normalized.includes('زنگ بزن')) {
    const contactName = callMatch ? callMatch[1].trim() : '';
    return {
      intent: 'MAKE_PHONE_CALL',
      confidence: contactName ? 0.95 : 0.7,
      entities: { contactName },
      rawQuery,
      normalizedQuery: normalized,
      riskLevel: 'MEDIUM',
      requiredPermission: 'android.permission.CALL_PHONE',
      requiresClarification: !contactName,
      clarificationPrompt: !contactName ? 'می‌خواهید با چه کسی تماس بگیرم؟' : undefined,
    };
  }

  // 2. Messaging / SMS Intent: "به علی پیام بده که میرسم", "ارسال پیام به سارا"
  const smsMatch = normalized.match(/(?:به|با)\s+([^\s]+)\s*(?:پیام\s*بده|اس\s*ام\s*اس\s*بده|پیامک\s*بفرست)(?:\s*(?:که|بگو)\s*(.+))?/) ||
                   normalized.match(/ارسال\s+پیام\s+به\s+([^\s]+)(?:\s*(?:با\s*متن|که)\s*(.+))?/);
  if (smsMatch || normalized.includes('پیام بده') || normalized.includes('پیامک بفرست')) {
    const recipient = smsMatch ? smsMatch[1].trim() : '';
    const message = smsMatch && smsMatch[2] ? smsMatch[2].trim() : '';
    return {
      intent: 'SEND_SMS',
      confidence: recipient ? 0.92 : 0.65,
      entities: { recipient, message },
      rawQuery,
      normalizedQuery: normalized,
      riskLevel: 'HIGH', // Sending messages has privacy impact and costs money
      requiredPermission: 'android.permission.SEND_SMS',
      requiresClarification: !recipient || !message,
      clarificationPrompt: !recipient
        ? 'به چه کسی می‌خواهید پیام بفرستید؟'
        : !message
        ? `متن پیام شما برای ${recipient} چیست؟`
        : undefined,
    };
  }

  // 3. Alarm / Timer Intent: "فردا ساعت ۸ صبح بیدارم کن", "یک زنگ برای ساعت ۹ بذار", "تایمر ۱۰ دقیقه‌ای بذار", "دو ساعت دیگه یادآوری کن"
  if (normalized.includes('بیدارم کن') || normalized.includes('زنگ بذار') || normalized.includes('ساعت بذار') || normalized.includes('تایمر') || normalized.includes('یاداوری') || normalized.includes('یادآوری')) {
    const timeInfo = extractPersianDateTime(rawQuery);
    return {
      intent: 'SET_ALARM',
      confidence: 0.94,
      entities: {
        hour: timeInfo.hour ?? 7,
        minute: timeInfo.minute ?? 0,
        dateDescription: timeInfo.dateDescription || 'امروز',
        isTimer: normalized.includes('تایمر'),
      },
      rawQuery,
      normalizedQuery: normalized,
      riskLevel: 'LOW',
      requiredPermission: 'android.permission.SET_ALARM',
      requiresClarification: timeInfo.hour === undefined && !normalized.includes('تایمر'),
      clarificationPrompt: timeInfo.hour === undefined ? 'برای چه ساعتی زنگ هشدار تنظیم کنم؟' : undefined,
    };
  }

  // 4. Memory Retention Intent: "یادت باشه کلید رو گذاشتم روی میز", "یادت نره من فردا امتحان دارم"
  const memoryMatch = normalized.match(/یادت\s+(?:باشه|نره|بمونه)\s*(.+)/);
  if (memoryMatch) {
    const memoryContent = memoryMatch[1].trim();
    return {
      intent: 'REMEMBER_INFO',
      confidence: 0.96,
      entities: { content: memoryContent },
      rawQuery,
      normalizedQuery: normalized,
      riskLevel: 'LOW',
      requiresClarification: false,
    };
  }

  // 5. Memory Retrieval Intent: "کلیدم کجاست؟", "یادت هست چی گفته بودم؟", "چه چیزهایی یادته؟"
  if (normalized.includes('کجاست') || normalized.includes('یادت هست') || normalized.includes('یادته') || normalized.includes('چی ذخیره کردی')) {
    return {
      intent: 'RECALL_INFO',
      confidence: 0.88,
      entities: { query: normalized },
      rawQuery,
      normalizedQuery: normalized,
      riskLevel: 'LOW',
      requiresClarification: false,
    };
  }

  // 6. Calendar Event / Reminder: "یک یادآوری برای جلسه فردا بذار", "رویداد ثبت کن"
  if (normalized.includes('یادآوری') || normalized.includes('جلسه') || normalized.includes('رویداد')) {
    const timeInfo = extractPersianDateTime(rawQuery);
    return {
      intent: 'ADD_CALENDAR_EVENT',
      confidence: 0.9,
      entities: {
        title: rawQuery.replace(/(یادآوری|ثبت کن|بذار|جلسه)/g, '').trim() || 'یادآوری جدید',
        timeInfo,
      },
      rawQuery,
      normalizedQuery: normalized,
      riskLevel: 'LOW',
      requiredPermission: 'android.permission.WRITE_CALENDAR',
      requiresClarification: false,
    };
  }

  // 7. Device Settings / Volume / Wi-Fi: "بلوتوث رو روشن کن", "وای فای رو خاموش کن", "صدا رو کم کن"
  if (normalized.includes('روشن کن') || normalized.includes('خاموش کن') || normalized.includes('صدا رو')) {
    let settingType = 'UNKNOWN';
    let action = 'TOGGLE';
    if (normalized.includes('بلوتوث')) settingType = 'BLUETOOTH';
    else if (normalized.includes('وای فای') || normalized.includes('اینترنت')) settingType = 'WIFI';
    else if (normalized.includes('چراغ قوه')) settingType = 'FLASHLIGHT';
    else if (normalized.includes('صدا')) settingType = 'VOLUME';

    if (normalized.includes('روشن کن')) action = 'ENABLE';
    else if (normalized.includes('خاموش کن')) action = 'DISABLE';
    else if (normalized.includes('زیاد کن')) action = 'INCREASE';
    else if (normalized.includes('کم کن')) action = 'DECREASE';

    return {
      intent: 'CHANGE_DEVICE_SETTING',
      confidence: 0.95,
      entities: { settingType, action },
      rawQuery,
      normalizedQuery: normalized,
      riskLevel: 'LOW',
      requiresClarification: settingType === 'UNKNOWN',
    };
  }

  // 8. Launch App: "تلگرام رو باز کن", "واتساپ رو باز کن", "یوتیوب رو باز کن"
  const appMatch = normalized.match(/([^\s]+)\s*رو\s*باز\s*کن/) || normalized.match(/اجرای\s+برنامه\s+([^\s]+)/);
  if (appMatch) {
    const appName = appMatch[1].trim();
    return {
      intent: 'OPEN_APPLICATION',
      confidence: 0.92,
      entities: { appName },
      rawQuery,
      normalizedQuery: normalized,
      riskLevel: 'LOW',
      requiresClarification: false,
    };
  }

  // Default: Conversational Question / Search
  return {
    intent: 'GENERAL_KNOWLEDGE_CONVERSATION',
    confidence: 0.8,
    entities: { query: rawQuery },
    rawQuery,
    normalizedQuery: normalized,
    riskLevel: 'LOW',
    requiresClarification: false,
  };
}
