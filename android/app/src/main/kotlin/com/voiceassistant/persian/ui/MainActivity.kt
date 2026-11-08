package com.voiceassistant.persian

import android.app.Application
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.voiceassistant.persian.core.audio.AudioSessionManager
import com.voiceassistant.persian.core.audio.CallStateGuard
import com.voiceassistant.persian.core.model.AssistantState
import com.voiceassistant.persian.core.model.CallSafetyState
import com.voiceassistant.persian.core.security.ActionSecurityGateway
import com.voiceassistant.persian.core.security.KeystoreManager
import com.voiceassistant.persian.core.statemachine.AssistantStateMachine
import com.voiceassistant.persian.engine.EngineManager
import com.voiceassistant.persian.memory.MemoryService
import com.voiceassistant.persian.nlp.PersianNlpProcessor
import com.voiceassistant.persian.ui.components.ClayButton
import com.voiceassistant.persian.ui.components.ClayCard
import com.voiceassistant.persian.ui.components.VoiceOrb3D
import com.voiceassistant.persian.ui.theme.AvaTheme

class AvaApplication : Application() {
    lateinit var stateMachine: AssistantStateMachine
    lateinit var securityGateway: ActionSecurityGateway
    lateinit var keystoreManager: KeystoreManager
    lateinit var memoryService: MemoryService
    lateinit var engineManager: EngineManager
    lateinit var nlpProcessor: PersianNlpProcessor
    lateinit var audioSessionManager: AudioSessionManager

    override fun onCreate() {
        super.onCreate()
        stateMachine = AssistantStateMachine()
        securityGateway = ActionSecurityGateway()
        keystoreManager = KeystoreManager(this)
        memoryService = MemoryService(keystoreManager)
        engineManager = EngineManager()
        nlpProcessor = PersianNlpProcessor()
        audioSessionManager = AudioSessionManager(this)

        CallStateGuard.stateMachine = stateMachine
    }
}

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val app = application as AvaApplication

        setContent {
            AvaTheme {
                val state by app.stateMachine.state.collectAsState()
                val callState by app.stateMachine.callState.collectAsState()
                var spokenText by remember { mutableStateOf("برای گفتگو با آوا دکمه را لمس کنید یا بگویید «آوا»") }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        // Header Status
                        ClayCard(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "دستیار صوتی آوا",
                                    fontSize = 18.sp,
                                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                                )
                                Text(
                                    text = when (state) {
                                        AssistantState.STANDBY -> "آماده‌باش"
                                        AssistantState.LISTENING_FOR_COMMAND -> "در حال شنیدن…"
                                        AssistantState.PROCESSING_SPEECH -> "پردازش گفتار…"
                                        AssistantState.EXECUTING_TASK -> "اجرای دستور…"
                                        AssistantState.SPEAKING -> "پاسخ‌گویی…"
                                        AssistantState.PAUSED -> "متوقف (تماس فعال)"
                                        else -> state.name
                                    },
                                    color = MaterialTheme.colorScheme.primary,
                                    fontSize = 14.sp
                                )
                            }
                        }

                        // Center 3D Voice Orb
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            VoiceOrb3D(
                                state = state,
                                onClick = {
                                    if (state == AssistantState.STANDBY) {
                                        app.stateMachine.transitionTo(AssistantState.LISTENING_FOR_COMMAND, "PTT Button Pressed")
                                        spokenText = "در حال شنیدن صدای شما..."
                                    } else if (state == AssistantState.LISTENING_FOR_COMMAND) {
                                        app.stateMachine.transitionTo(AssistantState.PROCESSING_SPEECH, "PTT Released")
                                        spokenText = "در حال درک زبان فارسی..."
                                    }
                                }
                            )
                            Spacer(modifier = Modifier.height(32.dp))
                            Text(
                                text = spokenText,
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }

                        // Bottom Actions
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            ClayButton(
                                text = "شبیه‌سازی تماس",
                                onClick = {
                                    if (callState == CallSafetyState.IDLE) {
                                        app.stateMachine.updateCallState(CallSafetyState.RINGING)
                                        spokenText = "تماس تلفنی برقرار شد؛ میکروفون دستیار متوقف گردید."
                                    } else {
                                        app.stateMachine.updateCallState(CallSafetyState.IDLE)
                                        spokenText = "تماس پایان یافت؛ بازگشت به حالت آماده‌باش."
                                    }
                                }
                            )
                            ClayButton(
                                text = "تنظیم زنگ ۸ صبح",
                                isPrimary = true,
                                onClick = {
                                    val intent = app.nlpProcessor.parseIntent("فردا ساعت ۸ صبح بیدارم کن")
                                    spokenText = "دستور تنظیم زنگ شناسایی شد: ساعت ۸:۰۰"
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
