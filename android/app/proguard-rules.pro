# Proguard rules for Ava Voice Assistant

# Keep data models
-keep class com.voiceassistant.persian.core.model.** { *; }

# Keep Room database
-keep class androidx.room.** { *; }
-dontwarn androidx.room.**

# Keep Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory { *; }
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler { *; }

# Keep Compose
-keepclassmembers class * extends androidx.compose.runtime.State { *; }
-keepclassmembers class * {
    @androidx.compose.runtime.Composable *;
}

# Crypto
-keep class androidx.security.crypto.** { *; }
