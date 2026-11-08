package com.voiceassistant.persian.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val PrimaryIndigo = Color(0xFF6366F1)
val SecondaryTeal = Color(0xFF0D9488)
val AccentCoral = Color(0xFFF43F5E)
val AccentAmber = Color(0xFFD97706)

val ClayBgLight = Color(0xFFF1F5F9)
val ClayCardLight = Color(0xFFF8FAFC)
val ClayShadowLight = Color(0xFFCBD5E1)

val ClayBgDark = Color(0xFF0F172A)
val ClayCardDark = Color(0xFF1E293B)
val ClayShadowDark = Color(0xFF020617)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryIndigo,
    secondary = SecondaryTeal,
    tertiary = AccentCoral,
    background = ClayBgLight,
    surface = ClayCardLight,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF0F172A)
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryIndigo,
    secondary = SecondaryTeal,
    tertiary = AccentCoral,
    background = ClayBgDark,
    surface = ClayCardDark,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC)
)

@Composable
fun AvaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
