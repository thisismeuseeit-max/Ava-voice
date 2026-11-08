import test from 'node:test';
import assert from 'node:assert/strict';
import { AssistantStateMachine } from './stateMachine';

test('AssistantStateMachine initializes in STANDBY and transitions correctly', () => {
  const sm = new AssistantStateMachine('STANDBY');
  assert.equal(sm.getState(), 'STANDBY');

  const ok1 = sm.transition('LISTENING_FOR_WAKE_WORD');
  assert.equal(ok1, true);
  assert.equal(sm.getState(), 'LISTENING_FOR_WAKE_WORD');

  const ok2 = sm.transition('WAKE_CONFIRMED');
  assert.equal(ok2, true);
  assert.equal(sm.getState(), 'WAKE_CONFIRMED');
});

test('AssistantStateMachine rejects invalid state transitions', () => {
  const sm = new AssistantStateMachine('STANDBY');
  const invalid = sm.transition('VERIFYING_RESULT');
  assert.equal(invalid, false);
  assert.equal(sm.getState(), 'STANDBY');
});

test('AssistantStateMachine enforces Call Safety: suspends during calls and rejects wakeups', () => {
  const sm = new AssistantStateMachine('STANDBY');
  sm.transition('LISTENING_FOR_WAKE_WORD');

  // Trigger incoming phone call
  sm.handleCallStateChange('RINGING');
  assert.equal(sm.getState(), 'PAUSED');

  // Attempting to wake up while phone is ringing MUST be rejected
  const wakeAttempt = sm.transition('LISTENING_FOR_WAKE_WORD');
  assert.equal(wakeAttempt, false);

  // Call answered (OFFHOOK)
  sm.handleCallStateChange('OFFHOOK');
  assert.equal(sm.getState(), 'PAUSED');

  // Call ended (IDLE) -> safe standby restoration
  sm.handleCallStateChange('IDLE');
  assert.equal(sm.getState(), 'STANDBY');
});
