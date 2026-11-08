import { AssistantState, CallState } from './types';

// Valid transitions lookup table
const VALID_TRANSITIONS: Record<AssistantState, AssistantState[]> = {
  IDLE: ['STANDBY', 'LISTENING_FOR_WAKE_WORD', 'LISTENING_FOR_COMMAND', 'ERROR'],
  STANDBY: ['LISTENING_FOR_WAKE_WORD', 'LISTENING_FOR_COMMAND', 'PROCESSING_SPEECH', 'UNDERSTANDING_INTENT', 'PAUSED', 'IDLE', 'ERROR'],
  LISTENING_FOR_WAKE_WORD: ['WAKE_CONFIRMED', 'STANDBY', 'PAUSED', 'IDLE', 'ERROR'],
  WAKE_CONFIRMED: ['LISTENING_FOR_COMMAND', 'SPEAKING', 'STANDBY', 'ERROR'],
  LISTENING_FOR_COMMAND: ['PROCESSING_SPEECH', 'UNDERSTANDING_INTENT', 'STANDBY', 'PAUSED', 'ERROR'],
  PROCESSING_SPEECH: ['UNDERSTANDING_INTENT', 'STANDBY', 'ERROR'],
  UNDERSTANDING_INTENT: ['PLANNING_TASK', 'WAITING_FOR_PERMISSION', 'SPEAKING', 'STANDBY', 'ERROR'],
  PLANNING_TASK: ['WAITING_FOR_PERMISSION', 'EXECUTING_TASK', 'SPEAKING', 'STANDBY', 'ERROR'],
  WAITING_FOR_PERMISSION: ['EXECUTING_TASK', 'SPEAKING', 'STANDBY', 'ERROR'],
  EXECUTING_TASK: ['VERIFYING_RESULT', 'SPEAKING', 'STANDBY', 'ERROR'],
  VERIFYING_RESULT: ['SPEAKING', 'STANDBY', 'ERROR'],
  SPEAKING: ['STANDBY', 'LISTENING_FOR_COMMAND', 'IDLE', 'ERROR'],
  PAUSED: ['STANDBY', 'LISTENING_FOR_WAKE_WORD', 'IDLE', 'ERROR'],
  ERROR: ['RECOVERING', 'IDLE', 'STANDBY'],
  RECOVERING: ['STANDBY', 'IDLE', 'ERROR'],
};

export class AssistantStateMachine {
  private currentState: AssistantState = 'IDLE';
  private callState: CallState = 'IDLE';
  private previousStateBeforeCall: AssistantState | null = null;
  private listeners: Array<(state: AssistantState, previous: AssistantState) => void> = [];
  private history: Array<{ from: AssistantState; to: AssistantState; timestamp: number; reason?: string }> = [];

  constructor(initialState: AssistantState = 'STANDBY') {
    this.currentState = initialState;
  }

  public getState(): AssistantState {
    return this.currentState;
  }

  public getCallState(): CallState {
    return this.callState;
  }

  public getHistory() {
    return [...this.history];
  }

  public subscribe(listener: (state: AssistantState, previous: AssistantState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public transition(targetState: AssistantState, reason?: string): boolean {
    if (targetState === this.currentState) {
      return true;
    }

    // If a phone call is active, disallow waking up or listening
    if ((this.callState === 'RINGING' || this.callState === 'OFFHOOK') &&
        (targetState === 'LISTENING_FOR_WAKE_WORD' || targetState === 'LISTENING_FOR_COMMAND' || targetState === 'WAKE_CONFIRMED')) {
      console.warn(`[AssistantStateMachine] Transition to ${targetState} blocked due to active call state: ${this.callState}`);
      return false;
    }

    const allowed = VALID_TRANSITIONS[this.currentState]?.includes(targetState);
    if (!allowed) {
      console.error(`[AssistantStateMachine] Invalid transition from ${this.currentState} to ${targetState}`);
      return false;
    }

    const previous = this.currentState;
    this.currentState = targetState;
    this.history.push({ from: previous, to: targetState, timestamp: Date.now(), reason });

    // Keep history bounded
    if (this.history.length > 50) {
      this.history.shift();
    }

    this.listeners.forEach(fn => fn(targetState, previous));
    return true;
  }

  /**
   * Phone Call Event Handler (Section 4.4 of spec):
   * Prevents unintended wakeups during phone calls.
   * When call rings or is offhook, immediately pause/suspend voice listening.
   * When call returns to idle, restore state safely.
   */
  public handleCallStateChange(newCallState: CallState): void {
    const prevCallState = this.callState;
    this.callState = newCallState;

    if (newCallState === 'RINGING' || newCallState === 'OFFHOOK') {
      if (this.currentState === 'LISTENING_FOR_WAKE_WORD' ||
          this.currentState === 'LISTENING_FOR_COMMAND' ||
          this.currentState === 'SPEAKING') {
        this.previousStateBeforeCall = this.currentState;
        this.transition('PAUSED', `Suspended due to incoming/active call (${newCallState})`);
      }
    } else if (newCallState === 'IDLE' && (prevCallState === 'RINGING' || prevCallState === 'OFFHOOK')) {
      // Call ended, resume safe standby
      this.previousStateBeforeCall = null;
      if (this.currentState === 'PAUSED') {
        this.transition('STANDBY', 'Call ended, resuming standby');
      }
    }
  }

  public reset(): void {
    const prev = this.currentState;
    this.currentState = 'STANDBY';
    this.listeners.forEach(fn => fn('STANDBY', prev));
  }
}
