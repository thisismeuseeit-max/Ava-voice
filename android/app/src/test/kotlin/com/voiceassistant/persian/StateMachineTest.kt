package com.voiceassistant.persian

import com.voiceassistant.persian.core.model.AssistantState
import com.voiceassistant.persian.core.model.CallSafetyState
import com.voiceassistant.persian.core.statemachine.AssistantStateMachine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class StateMachineTest {

    @Test
    fun testValidTransitions() {
        val sm = AssistantStateMachine(AssistantState.STANDBY)
        assertTrue(sm.transitionTo(AssistantState.LISTENING_FOR_WAKE_WORD))
        assertTrue(sm.transitionTo(AssistantState.WAKE_CONFIRMED))
        assertTrue(sm.transitionTo(AssistantState.LISTENING_FOR_COMMAND))
    }

    @Test
    fun testInvalidTransitionRejected() {
        val sm = AssistantStateMachine(AssistantState.STANDBY)
        assertFalse(sm.transitionTo(AssistantState.VERIFYING_RESULT))
        assertEquals(AssistantState.STANDBY, sm.state.value)
    }

    @Test
    fun testCallInterferenceSuspension() {
        val sm = AssistantStateMachine(AssistantState.STANDBY)
        sm.transitionTo(AssistantState.LISTENING_FOR_COMMAND)

        // Incoming call rings
        sm.updateCallState(CallSafetyState.RINGING)
        assertEquals(AssistantState.PAUSED, sm.state.value)

        // Cannot wake up during call
        assertFalse(sm.transitionTo(AssistantState.LISTENING_FOR_COMMAND))

        // Call finishes
        sm.updateCallState(CallSafetyState.IDLE)
        assertEquals(AssistantState.STANDBY, sm.state.value)
    }
}
