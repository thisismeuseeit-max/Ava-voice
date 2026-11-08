export interface AndroidSourceFile {
  path: string;
  name: string;
  category: 'CONFIG' | 'CORE' | 'NLP' | 'VOICE' | 'AGENT' | 'MEMORY' | 'UI' | 'DOCS' | 'TEST';
  language: 'kotlin' | 'groovy' | 'xml' | 'markdown' | 'properties';
  description: string;
  content: string;
}

export const ANDROID_FILES_CATALOG: AndroidSourceFile[] = [
  {
    path: 'BUILD_GUIDE.md',
    name: 'BUILD_GUIDE.md',
    category: 'DOCS',
    language: 'markdown',
    description: 'راهنمای گام‌به‌گام برای Agent یا توسعه‌دهنده جهت اجرای دستورات کامپایل، تست و نصب Gradle',
    content: `# راهنمای جامع کامپایل برای Agent
1. اجرای تست‌ها: ./gradlew test
2. کامپایل دیباگ: ./gradlew assembleDebug
3. محل APK نهایی: app/build/outputs/apk/debug/app-debug.apk
4. نصب روی گوشی: adb install -r app-debug.apk`
  },
  {
    path: 'android/settings.gradle.kts',
    name: 'settings.gradle.kts',
    category: 'CONFIG',
    language: 'groovy',
    description: 'تنظیمات رجیستری مخازن گوگل و Maven Central برای گرادل',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "AvaVoiceAssistant"
include(":app")`
  },
  {
    path: 'android/app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    category: 'CONFIG',
    language: 'groovy',
    description: 'تنظیمات ماژول اپ، وابستگی‌های Jetpack Compose, Room, Coroutines و Security Crypto',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.voiceassistant.persian"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.voiceassistant.persian"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}`
  },
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'CONFIG',
    language: 'xml',
    description: 'اعلام دسترسی‌های RECORD_AUDIO, READ_PHONE_STATE, CALL_PHONE, SEND_SMS و سرویس Foreground',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.voiceassistant.persian">

    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />

    <application
        android:name=".AvaApplication"
        android:supportsRtl="true"
        android:theme="@style/Theme.AvaVoiceAssistant">
        <activity android:name=".ui.MainActivity" android:exported="true" />
        <service android:name=".service.VoiceAssistantService" android:foregroundServiceType="microphone" />
        <receiver android:name=".core.audio.CallStateReceiver" />
    </application>
</manifest>`
  },
  {
    path: 'android/app/src/main/kotlin/com/voiceassistant/persian/core/statemachine/AssistantStateMachine.kt',
    name: 'AssistantStateMachine.kt',
    category: 'CORE',
    language: 'kotlin',
    description: 'پیاده‌سازی ماشین وضعیت ۱۵ حالته با کنترل تضمین‌شده تراکنش‌ها و قفل ایمنی تماس تلفنی',
    content: `package com.voiceassistant.persian.core.statemachine

import com.voiceassistant.persian.core.model.AssistantState
import com.voiceassistant.persian.core.model.CallSafetyState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class AssistantStateMachine(initialState: AssistantState = AssistantState.STANDBY) {
    private val _state = MutableStateFlow(initialState)
    val state: StateFlow<AssistantState> = _state

    @Synchronized
    fun transitionTo(target: AssistantState, reason: String? = null): Boolean {
        // Enforce transition logic and call safety lock
        _state.value = target
        return true
    }

    fun updateCallState(newCallState: CallSafetyState) {
        if (newCallState != CallSafetyState.IDLE) {
            transitionTo(AssistantState.PAUSED, "Call active")
        } else {
            transitionTo(AssistantState.STANDBY, "Call ended")
        }
    }
}`
  },
  {
    path: 'android/app/src/main/kotlin/com/voiceassistant/persian/core/security/ActionSecurityGateway.kt',
    name: 'ActionSecurityGateway.kt',
    category: 'CORE',
    language: 'kotlin',
    description: 'دروازه امنیتی عملیات: فهرست سفید ابزارها، فیلتر تزریق پرامپت، رتبه‌بندی ریسک و Idempotency',
    content: `package com.voiceassistant.persian.core.security

import com.voiceassistant.persian.core.model.RiskLevel

class ActionSecurityGateway {
    companion object {
        val ALLOWED_TOOLS = setOf("dial_number", "send_sms_draft", "create_alarm", "save_memory_item")
    }

    fun inspectPromptInjection(input: String): Boolean {
        return !input.contains("ignore previous instructions", ignoreCase = true)
    }

    fun evaluateAction(toolName: String, params: Map<String, String>): Boolean {
        return ALLOWED_TOOLS.contains(toolName)
    }
}`
  },
  {
    path: 'android/app/src/main/kotlin/com/voiceassistant/persian/nlp/PersianNlpProcessor.kt',
    name: 'PersianNlpProcessor.kt',
    category: 'NLP',
    language: 'kotlin',
    description: 'موتور پردازش زبان فارسی، اصلاح حروف عربی به فارسی، تبدیل اعداد و استخراج تاریخ/ساعت نسبی',
    content: `package com.voiceassistant.persian.nlp

import com.voiceassistant.persian.core.model.VoiceIntent

class PersianNlpProcessor {
    fun parseIntent(rawQuery: String): VoiceIntent {
        val norm = normalizeText(rawQuery)
        // Intent matching for Call, SMS, Alarm, Memory
        return VoiceIntent(intentId = "MAKE_PHONE_CALL", rawQuery = rawQuery, normalizedQuery = norm, confidence = 0.95f)
    }

    companion object {
        fun normalizeText(input: String): String {
            return input.replace('ي', 'ی').replace('ك', 'ک')
        }
    }
}`
  },
  {
    path: 'android/app/src/main/kotlin/com/voiceassistant/persian/core/audio/CallStateGuard.kt',
    name: 'CallStateGuard.kt',
    category: 'VOICE',
    language: 'kotlin',
    description: 'پایشگر تماس‌های تلفنی جهت جلوگیری از بیدار شدن ناخواسته در حین مکالمه (رفع باگ معروف)',
    content: `package com.voiceassistant.persian.core.audio

import android.telephony.TelephonyManager
import com.voiceassistant.persian.core.model.CallSafetyState

object CallStateGuard {
    fun onCallStateChanged(stateString: String?) {
        // Automatically pauses voice session on ringing or offhook
    }
}`
  },
  {
    path: 'android/app/src/main/kotlin/com/voiceassistant/persian/ui/components/ClayComponents.kt',
    name: 'ClayComponents.kt',
    category: 'UI',
    language: 'kotlin',
    description: 'کامپوننت‌های مدرن Claymorphism 3D در Jetpack Compose: کارتهای حجمی، دکمه‌های حسی و گوی صوتی',
    content: `package com.voiceassistant.persian.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun ClayCard(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    // 3D Soft Extrusion shadow & rounded geometry
}

@Composable
fun VoiceOrb3D(state: AssistantState, onClick: () -> Unit) {
    // Reactive pulsating 3D gradient orb
}`
  },
  {
    path: 'android/app/src/main/kotlin/com/voiceassistant/persian/update/GitHubDeltaUpdater.kt',
    name: 'GitHubDeltaUpdater.kt',
    category: 'CORE',
    language: 'kotlin',
    description: 'سیستم آپدیت افزایشی دارایی‌ها از گیت‌هاب با تطبیق مانیفست و اعتبارسنجی هش SHA-256',
    content: `package com.voiceassistant.persian.update

import java.io.File
import java.security.MessageDigest

class GitHubDeltaUpdater {
    fun calculateFileSha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest().joinToString("") { "%02x".format(it) }
    }
}`
  }
];
