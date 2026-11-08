package com.voiceassistant.persian.core.model

/**
 * Assistant State Machine states according to Master Spec section 4.2
 */
enum class AssistantState {
    IDLE,
    STANDBY,
    LISTENING_FOR_WAKE_WORD,
    WAKE_CONFIRMED,
    LISTENING_FOR_COMMAND,
    PROCESSING_SPEECH,
    UNDERSTANDING_INTENT,
    PLANNING_TASK,
    WAITING_FOR_PERMISSION,
    EXECUTING_TASK,
    VERIFYING_RESULT,
    SPEAKING,
    PAUSED,
    ERROR,
    RECOVERING
}

/**
 * Risk classification for Action Security Gateway (Master Spec section 7.1 & 9.3)
 */
enum class RiskLevel {
    LOW,        // Direct execution within granted permissions (e.g. read, alarm)
    MEDIUM,     // Noticeable action (e.g. initiating phone call dialer)
    HIGH,       // Explicit fresh user confirmation required (e.g. sending SMS, financial)
    PROHIBITED  // Forbidden (e.g. arbitrary shell execution, keystore export)
}

/**
 * Telephony call state for Call Safety Guard (Master Spec section 4.4)
 */
enum class CallSafetyState {
    IDLE,
    RINGING,
    OFFHOOK
}

/**
 * Parsed intent from Persian language processing
 */
data class VoiceIntent(
    val intentId: String,
    val rawQuery: String,
    val normalizedQuery: String,
    val confidence: Float,
    val entities: Map<String, String> = emptyMap(),
    val riskLevel: RiskLevel = RiskLevel.LOW,
    val requiredPermission: String? = null,
    val requiresClarification: Boolean = false,
    val clarificationPrompt: String? = null
)

/**
 * Task and step models for agentic execution (Master Spec section 7)
 */
enum class TaskStatus {
    PENDING,
    RUNNING,
    WAITING_FOR_USER,
    COMPLETED,
    FAILED,
    CANCELLED
}

data class TaskStep(
    val stepId: String,
    val description: String,
    val toolName: String,
    val parameters: Map<String, String>,
    var status: TaskStatus = TaskStatus.PENDING,
    var resultSummary: String? = null,
    var errorCode: String? = null
)

data class TaskPlan(
    val taskId: String,
    val createdAt: Long = System.currentTimeMillis(),
    val originalRequest: String,
    val steps: List<TaskStep>,
    var status: TaskStatus = TaskStatus.PENDING,
    var currentStepIndex: Int = 0
)

/**
 * User memory records (Master Spec section 6)
 */
enum class MemoryCategory {
    SHORT_TERM, // Current conversation context
    PREFERENCE, // User preferred settings, names, addresses
    EPISODIC,   // Interaction milestones
    TASK        // Past tasks
}

data class MemoryRecord(
    val id: String,
    val category: MemoryCategory,
    val key: String,
    val value: String,
    val confidence: Float,
    val createdAt: Long = System.currentTimeMillis()
)

/**
 * Engine audit & health status (Master Spec section 5)
 */
enum class EngineRole {
    WAKE_WORD,
    VAD,
    STT,
    NLP,
    PLANNER,
    TTS,
    MEMORY
}

data class EngineHealth(
    val role: EngineRole,
    val name: String,
    val isPrimary: Boolean,
    val isAvailable: Boolean,
    val latencyMs: Long,
    val ramUsageMb: Float,
    val requiresInternet: Boolean
)
