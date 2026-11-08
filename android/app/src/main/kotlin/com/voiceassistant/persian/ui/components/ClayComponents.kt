package com.voiceassistant.persian.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.voiceassistant.persian.core.model.AssistantState

/**
 * 3D Clay Card with dual soft shadow elevation and rounded geometry (Master Spec section 11)
 */
@Composable
fun ClayCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 24.dp,
    backgroundColor: Color = MaterialTheme.colorScheme.surface,
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier
            .shadow(
                elevation = 8.dp,
                shape = RoundedCornerShape(cornerRadius),
                ambientColor = Color(0x33A3B1C6),
                spotColor = Color(0x40A3B1C6)
            )
            .clip(RoundedCornerShape(cornerRadius))
            .background(backgroundColor)
            .padding(16.dp)
    ) {
        content()
    }
}

/**
 * 3D Clay Button with tactile press and soft extrusion
 */
@Composable
fun ClayButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isPrimary: Boolean = false,
    enabled: Boolean = true
) {
    val bgBrush = if (isPrimary) {
        Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)))
    } else {
        Brush.linearGradient(listOf(Color(0xFFF1F5F9), Color(0xFFE2E8F0)))
    }

    Box(
        modifier = modifier
            .shadow(
                elevation = if (enabled) 6.dp else 2.dp,
                shape = RoundedCornerShape(16.dp),
                spotColor = if (isPrimary) Color(0x666366F1) else Color(0x4094A3B8)
            )
            .clip(RoundedCornerShape(16.dp))
            .background(bgBrush)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 20.dp, vertical = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (isPrimary) Color.White else Color(0xFF1E293B),
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp
        )
    }
}

/**
 * Colorful 3D Voice Orb with state-reactive pulsation (Master Spec section 11.5)
 */
@Composable
fun VoiceOrb3D(
    state: AssistantState,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isListening = state == AssistantState.LISTENING_FOR_COMMAND || state == AssistantState.LISTENING_FOR_WAKE_WORD
    val transition = rememberInfiniteTransition(label = "OrbPulse")
    val scale by transition.animateFloat(
        initialValue = 1.0f,
        targetValue = if (isListening) 1.15f else 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "OrbScale"
    )

    val gradient = when (state) {
        AssistantState.LISTENING_FOR_COMMAND -> listOf(Color(0xFF6366F1), Color(0xFFEC4899), Color(0xFF3B82F6))
        AssistantState.PROCESSING_SPEECH, AssistantState.UNDERSTANDING_INTENT -> listOf(Color(0xFF8B5CF6), Color(0xFFF43F5E))
        AssistantState.EXECUTING_TASK -> listOf(Color(0xFF0D9488), Color(0xFF14B8A6))
        AssistantState.SPEAKING -> listOf(Color(0xFFD97706), Color(0xFFF59E0B))
        AssistantState.PAUSED -> listOf(Color(0xFF64748B), Color(0xFF94A3B8))
        AssistantState.ERROR -> listOf(Color(0xFFE11D48), Color(0xFFBE123C))
        else -> listOf(Color(0xFF6366F1), Color(0xFF8B5CF6))
    }

    Box(
        modifier = modifier
            .size((140 * scale).dp)
            .shadow(
                elevation = 20.dp,
                shape = CircleShape,
                ambientColor = gradient[0],
                spotColor = gradient.last()
            )
            .clip(CircleShape)
            .background(Brush.radialGradient(gradient))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        // Inner depth highlight
        Box(
            modifier = Modifier
                .size((100 * scale).dp)
                .clip(CircleShape)
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0x66FFFFFF), Color(0x11000000))
                    )
                )
        )
    }
}
