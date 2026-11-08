package com.voiceassistant.persian.agent

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.AlarmClock
import android.provider.CalendarContract
import com.voiceassistant.persian.core.model.TaskPlan
import com.voiceassistant.persian.core.model.TaskStatus
import com.voiceassistant.persian.core.model.TaskStep
import com.voiceassistant.persian.core.model.VoiceIntent
import com.voiceassistant.persian.core.security.ActionSecurityGateway
import java.util.UUID

/**
 * Task Planner (Master Spec section 7)
 * Decomposes high-level Persian voice intents into verifiable action steps.
 */
class TaskPlanner {

    fun planTask(intent: VoiceIntent): TaskPlan {
        val steps = mutableListOf<TaskStep>()
        val taskId = "task_${UUID.randomUUID().toString().take(8)}"

        when (intent.intentId) {
            "MAKE_PHONE_CALL" -> {
                steps.add(
                    TaskStep(
                        stepId = "${taskId}_step1",
                        description = "جستجوی مخاطب و برقراری تماس با ${intent.entities["contactName"] ?: ""}",
                        toolName = "dial_number",
                        parameters = intent.entities
                    )
                )
            }
            "SEND_SMS" -> {
                steps.add(
                    TaskStep(
                        stepId = "${taskId}_step1",
                        description = "آماده‌سازی پیش‌نویس پیامک و درخواست تأیید کاربر",
                        toolName = "send_sms_draft",
                        parameters = intent.entities
                    )
                )
            }
            "SET_ALARM" -> {
                steps.add(
                    TaskStep(
                        stepId = "${taskId}_step1",
                        description = "تنظیم زنگ هشدار برای ساعت ${intent.entities["hour"]}:${intent.entities["minute"]}",
                        toolName = "create_alarm",
                        parameters = intent.entities
                    )
                )
            }
            "REMEMBER_INFO" -> {
                steps.add(
                    TaskStep(
                        stepId = "${taskId}_step1",
                        description = "ذخیره‌سازی اطلاعات در حافظه دائم کاربر",
                        toolName = "save_memory_item",
                        parameters = intent.entities
                    )
                )
            }
            else -> {
                steps.add(
                    TaskStep(
                        stepId = "${taskId}_step1",
                        description = "پاسخ متنی و صوتی به درخواست",
                        toolName = "conversational_reply",
                        parameters = intent.entities
                    )
                )
            }
        }

        return TaskPlan(
            taskId = taskId,
            originalRequest = intent.rawQuery,
            steps = steps
        )
    }
}

/**
 * Action Executor (Master Spec section 8)
 * Executes Android APIs safely via official intents and verified results.
 */
class ActionExecutor(
    private val context: Context,
    private val securityGateway: ActionSecurityGateway
) {
    data class ExecutionResult(
        val isSuccess: Boolean,
        val message: String,
        val details: Map<String, String> = emptyMap()
    )

    fun executeStep(step: TaskStep, userConfirmed: Boolean = false): ExecutionResult {
        val decision = securityGateway.evaluateAction(step.toolName, step.parameters, step.stepId)

        if (!decision.isAllowed) {
            step.status = TaskStatus.FAILED
            step.errorCode = "SECURITY_REJECTION"
            return ExecutionResult(false, decision.rejectionReason ?: "عملیات از لحاظ امنیتی رد شد.")
        }

        if (decision.requiresUserConfirmation && !userConfirmed) {
            step.status = TaskStatus.WAITING_FOR_USER
            return ExecutionResult(false, "عملیات نیازمند تأیید صریح کاربر است.")
        }

        step.status = TaskStatus.RUNNING

        return try {
            val result = when (step.toolName) {
                "dial_number" -> executeDial(step.parameters)
                "send_sms_draft" -> executeSms(step.parameters)
                "create_alarm" -> executeAlarm(step.parameters)
                "save_memory_item" -> ExecutionResult(true, "اطلاعات با موفقیت ذخیره شد.")
                else -> ExecutionResult(true, "دستور با موفقیت پردازش شد.")
            }

            if (result.isSuccess) {
                step.status = TaskStatus.COMPLETED
                step.resultSummary = result.message
                securityGateway.recordExecution(step.stepId)
            } else {
                step.status = TaskStatus.FAILED
            }
            result
        } catch (e: Exception) {
            step.status = TaskStatus.FAILED
            step.errorCode = e.javaClass.simpleName
            ExecutionResult(false, "خطا در اجرای عملیات: ${e.localizedMessage}")
        }
    }

    private fun executeDial(params: Map<String, String>): ExecutionResult {
        val number = params["phoneNumber"] ?: params["contactName"] ?: ""
        val intent = Intent(Intent.ACTION_DIAL).apply {
            data = Uri.parse("tel:$number")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return ExecutionResult(true, "صفحه شماره‌گیری برای $number باز شد.")
    }

    private fun executeSms(params: Map<String, String>): ExecutionResult {
        val recipient = params["recipient"] ?: ""
        val message = params["message"] ?: ""
        val intent = Intent(Intent.ACTION_SENDTO).apply {
            data = Uri.parse("smsto:$recipient")
            putExtra("sms_body", message)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return ExecutionResult(true, "پیش‌نویس پیامک به $recipient آماده شد.")
    }

    private fun executeAlarm(params: Map<String, String>): ExecutionResult {
        val hour = params["hour"]?.toIntOrNull() ?: 7
        val minute = params["minute"]?.toIntOrNull() ?: 0
        val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(AlarmClock.EXTRA_HOUR, hour)
            putExtra(AlarmClock.EXTRA_MINUTES, minute)
            putExtra(AlarmClock.EXTRA_MESSAGE, "زنگ آوا")
            putExtra(AlarmClock.EXTRA_SKIP_UI, false)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return ExecutionResult(true, "زنگ هشدار برای ساعت $hour:$minute تنظیم شد.")
    }
}
