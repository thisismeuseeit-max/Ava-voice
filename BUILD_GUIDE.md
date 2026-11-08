# راهنمای جامع کامپایل و ساخت پروژه اندروید برای Agent و توسعه‌دهنده
## Android Compilation, Verification & Deployment Master Guide (Version 1.0.0)

این سند راهنمای گام‌به‌گام و فنی برای کامپایل، تست و استقرار سورس کد پروژه دستیار صوتی «آوا» توسط **یک هوش مصنوعی (Agent)** یا **مهندس نرم‌افزار** در محیط‌های CI/CD، لینوکس، مک یا ویندوز است.

---

## ۱. پیش‌نیازهای سیستم (System Prerequisites)

برای ساخت بدون خطای پروژه، وجود ابزارهای زیر در سیستم الزامی است:

| ابزار | حداقل نسخه | نسخه توصیه‌شده | توضیحات |
|---|---|---|---|
| **JDK (Java Development Kit)** | OpenJDK 17 | OpenJDK 17 یا 21 | در متغیر `JAVA_HOME` تنظیم شده باشد |
| **Android SDK** | API Level 34 (Android 14) | API Level 34 (compileSdk=34) | نصب از طریق `sdkmanager` |
| **Android Build Tools** | 34.0.0 | 34.0.0 | - |
| **Gradle** | 8.4+ | 8.7 (موجود در Gradle Wrapper) | نیازی به نصب مجزا ندارد؛ `./gradlew` استفاده شود |
| **NDK (اختیاری)** | 26.1.10909125 | در صورت استفاده از کتابخانه‌های C++ | - |

---

## ۲. ساختار سورس تحویل‌شده

```text
/android/
  ├── build.gradle.kts                # تنظیمات بیلد ریشه پروژه
  ├── settings.gradle.kts             # رجیستری ماژول‌ها و مخازن Maven
  ├── gradle.properties               # حافظه JVM (4GB) و فلگ‌های AndroidX
  ├── gradle/
  │   ├── libs.versions.toml          # کاتالوگ متمرکز نسخه‌ها و کتابخانه‌ها
  │   └── wrapper/gradle-wrapper.properties # گرادل نسخه 8.7
  └── app/
      ├── build.gradle.kts            # تنظیمات ماژول اپ، وابستگی‌های Compose و Room
      ├── proguard-rules.pro          # قوانین ProGuard/R8 برای نسخه Release
      ├── src/
      │   ├── main/
      │   │   ├── AndroidManifest.xml # مجوزها، سرویس Foreground و Call Receiver
      │   │   ├── res/                # رنگ‌ها، تم‌ها و رشته‌های فارسی/انگلیسی
      │   │   └── kotlin/com/voiceassistant/persian/
      │   │       ├── core/           # ماشین وضعیت، امنیت Keystore و گارد تماس
      │   │       ├── nlp/            # موتور پردازش زبان و اصطلاحات فارسی
      │   │       ├── agent/          # برنامه‌ریز Task و مجری ابزارهای اندروید
      │   │       ├── voice/          # رابط‌های STT, TTS و Wake Word
      │   │       ├── memory/         # سرویس حافظه و پاک‌سازی داده
      │   │       ├── engine/         # مدیر مرکزی موتورها و Fallback
      │   │       ├── update/         # آپدیتر افزایشی گیت‌هاب با اعتبارسنجی SHA-256
      │   │       ├── ui/             # رابط مدرن Claymorphism 3D با Jetpack Compose
      │   │       └── service/        # سرویس پس‌زمینه برای آماده‌باش دائم
      │   └── test/                   # تست‌های واحد JUnit4 و Coroutines
```

---

## ۳. دستورات گام‌به‌گام برای Agent کامپایل‌کننده

Agent می‌تواند مستقیماً دستورات زیر را در پوشه `/android` اجرا کند:

### مرحله ۱: بررسی متغیرهای محیطی
```bash
cd android
echo "JAVA_HOME: $JAVA_HOME"
echo "ANDROID_HOME: $ANDROID_HOME"
java -version
```

### مرحله ۲: بررسی و اعطای دسترسی اجرایی به Gradle Wrapper
```bash
chmod +x ./gradlew
```

### مرحله ۳: اجرای تست‌های واحد خودکار (Unit Tests)
```bash
./gradlew test
```
*خروجی گزارش تست در مسیر:*
`app/build/reports/tests/testDebugUnitTest/index.html`

### مرحله ۴: کامپایل نسخه دیباگ (Assemble Debug APK)
```bash
./gradlew assembleDebug
```
*فایل نهایی تولیدشده:*
`app/build/outputs/apk/debug/app-debug.apk`

### مرحله ۵: ساخت نسخه نهایی بهینه‌شده (Assemble Release APK)
```bash
./gradlew assembleRelease
```
*فایل نهایی تولیدشده:*
`app/build/outputs/apk/release/app-release-unsigned.apk` (یا امضاشده با کلید دیباگ)

---

## ۴. نصب و تست روی دستگاه یا ایمولاتور اندروید

### ۴.۱. لیست کردن دستگاه‌های متصل
```bash
adb devices
```

### ۴.۲. نصب APK روی دستگاه
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### ۴.۳. اعطای مجوزهای حساس در زمان نصب (اختیاری جهت تست خودکار CI)
```bash
adb shell pm grant com.voiceassistant.persian android.permission.RECORD_AUDIO
adb shell pm grant com.voiceassistant.persian android.permission.READ_PHONE_STATE
adb shell pm grant com.voiceassistant.persian android.permission.CALL_PHONE
adb shell pm grant com.voiceassistant.persian android.permission.SEND_SMS
```

### ۴.۴. اجرای اکتیویتی اصلی از طریق ADB
```bash
adb shell am start -n com.voiceassistant.persian/.ui.MainActivity
```

### ۴.۵. پایش لاگ‌های امنیتی و چرخه حیات (Logcat بدون محتوای حساس)
```bash
adb logcat -s AssistantStateMachine:V ActionSecurityGateway:V VoiceAssistantService:V
```

---

## ۵. رفع خطاهای احتمالی (Troubleshooting for Agent)

1. **خطای `SDK location not found`**:
   یک فایل با نام `local.properties` در پوشه ریشه `/android` ایجاد کرده و مسیر SDK را بنویسید:
   ```properties
   sdk.dir=/path/to/android-sdk
   ```
2. **خطای حافظه Heap در زمان بیلد**:
   مقدار `org.gradle.jvmargs` در `gradle.properties` روی `-Xmx4096m` تنظیم شده است. اگر سرور شما رم کمتری دارد، آن را به `-Xmx2048m` کاهش دهید.
3. **خطای دسترسی در اجرای `./gradlew`**:
   دستور `chmod +x gradlew` را پیش از بیلد اجرا کنید.
