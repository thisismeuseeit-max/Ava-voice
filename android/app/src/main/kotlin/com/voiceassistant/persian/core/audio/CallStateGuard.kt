package com.voiceassistant.persian.core.audio

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import com.voiceassistant.persian.core.model.CallSafetyState
import com.voiceassistant.persian.core.statemachine.AssistantStateMachine

/**
 * Call State Guard (Master Spec section 4.4)
 * Coordinates call monitoring to suspend wake word & speech recognition during phone conversations.
 */
object CallStateGuard {
    var stateMachine: AssistantStateMachine? = null

    fun onCallStateChanged(stateString: String?) {
        val mappedState = when (stateString) {
            TelephonyManager.EXTRA_STATE_RINGING -> CallSafetyState.RINGING
            TelephonyManager.EXTRA_STATE_OFFHOOK -> CallSafetyState.OFFHOOK
            TelephonyManager.EXTRA_STATE_IDLE -> CallSafetyState.IDLE
            else -> CallSafetyState.IDLE
        }
        stateMachine?.updateCallState(mappedState)
    }
}

class CallStateReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            CallStateGuard.onCallStateChanged(state)
        }
    }
}
