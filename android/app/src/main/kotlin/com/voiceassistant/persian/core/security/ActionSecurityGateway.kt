package com.voiceassistant.persian.core.security

import com.voiceassistant.persian.core.model.RiskLevel
import java.util.concurrent.ConcurrentHashMap
import java.util.regex.Pattern

/**
 * Action Security Gateway (Master Spec section 9.3)
 * Guarantees no raw LLM output or arbitrary commands execute without allowlisting,
 * parameter validation, prompt injection filtration, and idempotency checks.
 */
class ActionSecurityGateway {

    private val executedIdempotencyKeys = ConcurrentHashMap.newKeySet<String>()

    companion object {
        val ALLOWED_TOOLS = setOf(
            "dial_number",
            "send_sms_draft",
            "create_alarm",
            "create_timer",
            "create_calendar_event",
            "save_memory_item",
            "retrieve_memory_item",
            "launch_application",
            "adjust_volume",
            "toggle_bluetooth",
            "toggle_wifi"
        )

        private val PROHIBITED_PATTERNS = listOf(
            Pattern.compile("ignore (all )?previous instructions", Pattern.CASE_INSENSITIVE),
            Pattern.compile("دستورات قبلی را نادیده بگیر", Pattern.CASE_INSENSITIVE),
            Pattern.compile("system prompt", Pattern.CASE_INSENSITIVE),
            Pattern.compile("rm -rf", Pattern.CASE_INSENSITIVE),
            Pattern.compile("drop database", Pattern.CASE_INSENSITIVE),
            Pattern.compile("grant all permissions", Pattern.CASE_INSENSITIVE),
            Pattern.compile("export keystore", Pattern.CASE_INSENSITIVE),
            Pattern.compile("steal (token|keys|password)", Pattern.CASE_INSENSITIVE)
        )
    }

    data class SecurityDecision(
        val isAllowed: Boolean,
        val riskLevel: RiskLevel,
        val requiresUserConfirmation: Boolean,
        val rejectionReason: String? = null
    )

    fun inspectPromptInjection(input: String): Boolean {
        for (pattern in PROHIBITED_PATTERNS) {
            if (pattern.matcher(input).find()) {
                return false
            }
        }
        return true
    }

    fun evaluateAction(
        toolName: String,
        parameters: Map<String, String>,
        idempotencyKey: String? = null
    ): SecurityDecision {
        // 1. Tool Allowlist Check
        if (!ALLOWED_TOOLS.contains(toolName)) {
            return SecurityDecision(
                isAllowed = false,
                riskLevel = RiskLevel.PROHIBITED,
                requiresUserConfirmation = false,
                rejectionReason = "ابزار $toolName در فهرست ابزارهای مجاز سیستم قرار ندارد."
            )
        }

        // 2. Idempotency Check
        if (idempotencyKey != null && executedIdempotencyKeys.contains(idempotencyKey)) {
            return SecurityDecision(
                isAllowed = false,
                riskLevel = RiskLevel.LOW,
                requiresUserConfirmation = false,
                rejectionReason = "عملیات قبلاً اجرا شده است و به جهت جلوگیری از تکرار رد شد."
            )
        }

        // 3. Risk Level & User Confirmation
        return when (toolName) {
            "send_sms_draft" -> {
                if (parameters["recipient"].isNullOrBlank() || parameters["message"].isNullOrBlank()) {
                    SecurityDecision(false, RiskLevel.HIGH, true, "گیرنده یا متن پیامک نامعتبر است.")
                } else {
                    SecurityDecision(true, RiskLevel.HIGH, true)
                }
            }
            "dial_number" -> {
                if (parameters["phoneNumber"].isNullOrBlank() && parameters["contactName"].isNullOrBlank()) {
                    SecurityDecision(false, RiskLevel.MEDIUM, false, "شماره تلفن یا نام مخاطب الزامی است.")
                } else {
                    SecurityDecision(true, RiskLevel.MEDIUM, false)
                }
            }
            else -> SecurityDecision(true, RiskLevel.LOW, false)
        }
    }

    fun recordExecution(idempotencyKey: String?) {
        if (!idempotencyKey.isNullOrBlank()) {
            executedIdempotencyKeys.add(idempotencyKey)
        }
    }
}
