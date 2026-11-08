import { RiskLevel, SecurityCheckResult } from './types';

// Strict allowlist of permissible tools in Android assistant
export const ALLOWED_TOOLS = [
  'dial_number',
  'send_sms_draft',
  'create_alarm',
  'create_timer',
  'create_calendar_event',
  'save_memory_item',
  'retrieve_memory_item',
  'launch_application',
  'adjust_volume',
  'toggle_bluetooth',
  'toggle_wifi',
] as const;

export type AllowedToolName = typeof ALLOWED_TOOLS[number];

// Dangerous keywords and prompt injection patterns
const PROHIBITED_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /دستورات قبلی را نادیده بگیر/i,
  /system prompt/i,
  /rm -rf/i,
  /drop database/i,
  /<script>/i,
  /base64/i,
  /grant all permissions/i,
  /export keystore/i,
  /steal (token|keys|password)/i,
];

export class ActionSecurityGateway {
  private executedIdempotencyKeys = new Set<string>();

  /**
   * Sanitizes and verifies user input for prompt injection or system policy tampering
   */
  public inspectPromptInjection(input: string): { isSafe: boolean; detectedThreat?: string } {
    for (const pattern of PROHIBITED_PATTERNS) {
      if (pattern.test(input)) {
        return {
          isSafe: false,
          detectedThreat: `Threat matched security pattern: ${pattern.toString()}`,
        };
      }
    }
    return { isSafe: true };
  }

  /**
   * Evaluates risk and checks whether the tool is in the allowlist
   */
  public validateAction(
    toolName: string,
    params: Record<string, any>,
    idempotencyKey?: string
  ): SecurityCheckResult {
    // 1. Tool Allowlist Check
    if (!ALLOWED_TOOLS.includes(toolName as AllowedToolName)) {
      return {
        allowed: false,
        reason: `ابزار ${toolName} در فهرست سفید امنیتی قرار ندارد و اجرای آن ممنوع است.`,
        riskLevel: 'PROHIBITED',
        requiresUserConfirmation: false,
      };
    }

    // 2. Idempotency Check (prevent duplicate accidental calls/SMS)
    if (idempotencyKey && this.executedIdempotencyKeys.has(idempotencyKey)) {
      return {
        allowed: false,
        reason: 'این عملیات قبلاً انجام شده است و برای جلوگیری از تکرار مجدد مسدود گردید.',
        riskLevel: 'LOW',
        requiresUserConfirmation: false,
      };
    }

    // 3. Risk Level Determination
    let riskLevel: RiskLevel = 'LOW';
    let requiresUserConfirmation = false;

    if (toolName === 'send_sms_draft') {
      riskLevel = 'HIGH'; // High risk: sending text messages
      requiresUserConfirmation = true;
    } else if (toolName === 'dial_number') {
      riskLevel = 'MEDIUM'; // Medium risk: phone dialing
      requiresUserConfirmation = false;
    } else if (toolName === 'create_alarm' || toolName === 'create_calendar_event') {
      riskLevel = 'LOW';
      requiresUserConfirmation = false;
    }

    // 4. Parameter Validation
    if (toolName === 'dial_number' && !params.phoneNumber && !params.contactName) {
      return {
        allowed: false,
        reason: 'شماره تلفن یا نام مخاطب الزامی است.',
        riskLevel,
        requiresUserConfirmation: false,
      };
    }

    if (toolName === 'send_sms_draft' && (!params.recipient || !params.message)) {
      return {
        allowed: false,
        reason: 'گیرنده و متن پیامک نمی‌تواند خالی باشد.',
        riskLevel,
        requiresUserConfirmation: true,
      };
    }

    return {
      allowed: true,
      riskLevel,
      requiresUserConfirmation,
    };
  }

  public recordExecution(idempotencyKey?: string): void {
    if (idempotencyKey) {
      this.executedIdempotencyKeys.add(idempotencyKey);
    }
  }
}
