package com.voiceassistant.persian.core.statemachine

import com.voiceassistant.persian.core.model.AssistantState
import com.voiceassistant.persian.core.model.CallSafetyState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.ConcurrentLinkedQueue

/**
 * Central State Machine (Master Spec section 4.2)
 * Manages valid state transitions and coordinates call-safety lock.
 */
class AssistantStateMachine(initialState: AssistantState = AssistantState.STANDBY) {

    private val _state = MutableStateFlow(initialState)
    val state: StateFlow<AssistantState> = _state.asStateFlow()

    private val _callState = MutableStateFlow(CallSafetyState.IDLE)
    val callState: StateFlow<CallSafetyState> = _callState.asStateFlow()

    private var previousStateBeforeCall: AssistantState? = null
    private val transitionHistory = ConcurrentLinkedQueue<TransitionRecord>()

    data class TransitionRecord(
        val from: AssistantState,
        val to: AssistantState,
        val timestamp: Long,
        val reason: String?
    )

    private val validTransitions: Map<AssistantState, Set<AssistantState>> = mapOf(
        AssistantState.IDLE to setOf(AssistantState.STANDBY, AssistantState.LISTENING_FOR_WAKE_WORD, AssistantState.LISTENING_FOR_COMMAND, AssistantState.ERROR),
        AssistantState.STANDBY to setOf(AssistantState.LISTENING_FOR_WAKE_WORD, AssistantState.LISTENING_FOR_COMMAND, AssistantState.PAUSED, AssistantState.IDLE, AssistantState.ERROR),
        AssistantState.LISTENING_FOR_WAKE_WORD to setOf(AssistantState.WAKE_CONFIRMED, AssistantState.STANDBY, AssistantState.PAUSED, AssistantState.IDLE, AssistantState.ERROR),
        AssistantState.WAKE_CONFIRMED to setOf(AssistantState.LISTENING_FOR_COMMAND, AssistantState.SPEAKING, AssistantState.STANDBY, AssistantState.ERROR),
        AssistantState.LISTENING_FOR_COMMAND to setOf(AssistantState.PROCESSING_SPEECH, AssistantState.STANDBY, AssistantState.PAUSED, AssistantState.ERROR),
        AssistantState.PROCESSING_SPEECH to setOf(AssistantState.UNDERSTANDING_INTENT, AssistantState.STANDBY, AssistantState.ERROR),
        AssistantState.UNDERSTANDING_INTENT to setOf(AssistantState.PLANNING_TASK, AssistantState.WAITING_FOR_PERMISSION, AssistantState.SPEAKING, AssistantState.STANDBY, AssistantState.ERROR),
        AssistantState.PLANNING_TASK to setOf(AssistantState.WAITING_FOR_PERMISSION, AssistantState.EXECUTING_TASK, AssistantState.SPEAKING, AssistantState.ERROR),
        AssistantState.WAITING_FOR_PERMISSION to setOf(AssistantState.EXECUTING_TASK, AssistantState.SPEAKING, AssistantState.STANDBY, AssistantState.ERROR),
        AssistantState.EXECUTING_TASK to setOf(AssistantState.VERIFYING_RESULT, AssistantState.SPEAKING, AssistantState.ERROR),
        AssistantState.VERIFYING_RESULT to setOf(AssistantState.SPEAKING, AssistantState.STANDBY, AssistantState.ERROR),
        AssistantState.SPEAKING to setOf(AssistantState.STANDBY, AssistantState.LISTENING_FOR_COMMAND, AssistantState.IDLE, AssistantState.ERROR),
        AssistantState.PAUSED to setOf(AssistantState.STANDBY, AssistantState.LISTENING_FOR_WAKE_WORD, AssistantState.IDLE, AssistantState.ERROR),
        AssistantState.ERROR to setOf(AssistantState.RECOVERING, AssistantState.IDLE, AssistantState.STANDBY),
        AssistantState.RECOVERING to setOf(AssistantState.STANDBY, AssistantState.IDLE, AssistantState.ERROR)
    )

    @Synchronized
    fun transitionTo(target: AssistantState, reason: String? = null): Boolean {
        // Enforce Call Safety: Block wakeups or speech listening during calls
        if ((_callState.value == CallSafetyState.RINGING || _callState.value == CallSafetyState.OFFHOOK) &&
            (target == AssistantState.LISTENING_FOR_WAKE_WORD ||
             target == AssistantState.LISTENING_FOR_COMMAND ||
             target == AssistantState.WAKE_CONFIRMED)
        ) {
            return false
        }

        val current = _state.value
        val allowed = validTransitions[current]?.contains(target) == true
        if (!allowed) {
            return false
        }

        _state.value = target
        transitionHistory.add(TransitionRecord(current, target, System.currentTimeMillis(), reason))
        if (transitionHistory.size > 100) {
            transitionHistory.poll()
        }
        return true
    }

    /**
     * Call Safety Guard (Section 4.4):
     * Suspends assistant immediately when a call arrives or is in progress.
     */
    @Synchronized
    fun updateCallState(newCallState: CallSafetyState) {
        val oldCallState = _callState.value
        _callState.value = newCallState

        if (newCallState == CallSafetyState.RINGING || newCallState == CallSafetyState.OFFHOOK) {
            val current = _state.value
            if (current == AssistantState.LISTENING_FOR_WAKE_WORD ||
                current == AssistantState.LISTENING_FOR_COMMAND ||
                current == AssistantState.SPEAKING
            ) {
                previousStateBeforeCall = current
                transitionTo(AssistantState.PAUSED, "Call active ($newCallState)")
            }
        } else if (newCallState == CallSafetyState.IDLE &&
            (oldCallState == CallSafetyState.RINGING || oldCallState == CallSafetyState.OFFHOOK)
        ) {
            previousStateBeforeCall = null
            if (_state.value == AssistantState.PAUSED) {
                transitionTo(AssistantState.STANDBY, "Call ended")
            }
        }
    }

    fun getHistory(): List<TransitionRecord> = transitionHistory.toList()
}
