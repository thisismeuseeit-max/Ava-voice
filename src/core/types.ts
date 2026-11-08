/**
 * Types and interfaces for the Persian Voice Assistant Core
 */

export type AssistantState =
  | 'IDLE'
  | 'STANDBY'
  | 'LISTENING_FOR_WAKE_WORD'
  | 'WAKE_CONFIRMED'
  | 'LISTENING_FOR_COMMAND'
  | 'PROCESSING_SPEECH'
  | 'UNDERSTANDING_INTENT'
  | 'PLANNING_TASK'
  | 'WAITING_FOR_PERMISSION'
  | 'EXECUTING_TASK'
  | 'VERIFYING_RESULT'
  | 'SPEAKING'
  | 'PAUSED'
  | 'ERROR'
  | 'RECOVERING';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED';

export type CallState = 'IDLE' | 'RINGING' | 'OFFHOOK';

export interface VoiceIntent {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  rawQuery: string;
  normalizedQuery: string;
  riskLevel: RiskLevel;
  requiredPermission?: string;
  requiresClarification: boolean;
  clarificationPrompt?: string;
}

export interface TaskStep {
  id: string;
  description: string;
  tool: string;
  parameters: Record<string, any>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  result?: any;
  error?: string;
}

export interface TaskPlan {
  taskId: string;
  createdAt: number;
  rawRequest: string;
  intent: string;
  steps: TaskStep[];
  status: 'PENDING' | 'RUNNING' | 'WAITING_FOR_USER' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  resultSummary?: string;
}

export interface MemoryItem {
  id: string;
  type: 'PREFERENCE' | 'SHORT_TERM' | 'EPISODIC' | 'TASK';
  key: string;
  value: string;
  confidence: number;
  timestamp: number;
  source: string;
}

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  riskLevel: RiskLevel;
  requiresUserConfirmation: boolean;
}

export interface ManifestFileEntry {
  filePath: string;
  fileSize: number;
  sha256: string;
  fileType: 'ASSET' | 'CONFIG' | 'MODEL';
  updateType: 'ADD' | 'MODIFY' | 'DELETE';
}

export interface UpdateManifest {
  version: string;
  buildNumber: number;
  releaseDate: string;
  minimumSupportedVersion: string;
  signature: string;
  files: ManifestFileEntry[];
}
