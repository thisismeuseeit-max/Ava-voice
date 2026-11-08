package com.voiceassistant.persian.nlp

import com.voiceassistant.persian.core.model.RiskLevel
import com.voiceassistant.persian.core.model.VoiceIntent
import java.util.regex.Pattern

/**
 * Persian NLP Engine (Master Spec section 3)
 * Full support for Iranian Persian (formal & colloquial, broken sentences, relative dates).
 */
class PersianNlpProcessor {

    companion object {
        fun normalizeText(input: String?): String {
            if (input.isNullOrBlank()) return ""
            var text = input.trim()

            // Standardize Arabic characters to Persian
            text = text.replace('ي', 'ی')
            text = text.replace('ك', 'ک')
            text = text.replace('ة', 'ه')
            text = text.replace('ؤ', 'و')
            text = text.replace(Regex("[إأآ]"), "ا")

            // Persian & Arabic numbers to English digits
            val persianDigits = charArrayOf('۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹')
            val arabicDigits = charArrayOf('٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩')

            for (i in 0..9) {
                text = text.replace(persianDigits[i], (i + 48).toChar())
                text = text.replace(arabicDigits[i], (i + 48).toChar())
            }

            // Zero-width non-joiner & whitespace collapse
            text = text.replace('\u200c', ' ')
            text = text.replace(Regex("\\s+"), " ")

            return text.lowercase()
        }
    }

    data class DateTimeExtraction(
        val dateDesc: String? = null,
        val hour: Int? = null,
        val minute: Int? = null,
        val relativeHours: Float? = null
    )

    fun extractDateTime(query: String): DateTimeExtraction {
        val norm = normalizeText(query)
        var dateDesc: String? = null
        var relativeHours: Float? = null
        var hour: Int? = null
        var minute: Int? = null

        if (norm.contains("فردا")) dateDesc = "فردا"
        else if (norm.contains("امروز")) dateDesc = "امروز"
        else if (norm.contains("پس فردا")) dateDesc = "پس‌فردا"

        val relMatch = Pattern.compile("(\\d+|یک|دو|سه|چهار|نیم)\\s*(ساعت|دقیقه)\\s*(دیگه|بعد)").matcher(norm)
        if (relMatch.find()) {
            val numStr = relMatch.group(1) ?: "1"
            val unit = relMatch.group(2) ?: "ساعت"
            val num = when (numStr) {
                "نیم" -> 0.5f
                "یک" -> 1f
                "دو" -> 2f
                "سه" -> 3f
                "چهار" -> 4f
                else -> numStr.toFloatOrNull() ?: 1f
            }
            if (unit == "ساعت") {
                relativeHours = num
            } else {
                minute = num.toInt()
            }
        }

        val timeMatch = Pattern.compile("ساعت\\s*(\\d+)(?:\\s*(و نیم|:(\\d+)))?\\s*(صبح|عصر|شب)?").matcher(norm)
        if (timeMatch.find()) {
            var h = timeMatch.group(1)?.toIntOrNull() ?: 8
            var m = 0
            val sub = timeMatch.group(2)
            if (sub?.contains("نیم") == true) {
                m = 30
            } else if (!timeMatch.group(3).isNullOrBlank()) {
                m = timeMatch.group(3)?.toIntOrNull() ?: 0
            }
            val period = timeMatch.group(4)
            if ((period == "عصر" || period == "شب") && h < 12) h += 12
            else if (period == "صبح" && h == 12) h = 0

            hour = h
            minute = m
        }

        return DateTimeExtraction(dateDesc, hour, minute, relativeHours)
    }

    fun parseIntent(rawQuery: String): VoiceIntent {
        val norm = normalizeText(rawQuery)

        // 1. Phone Call
        val callPattern = Pattern.compile("(?:تماس\\s+با|به|با)\\s+([^\\s]+)\\s*(?:زنگ\\s+بزن|تماس\\s+بگیر)")
        val callMatcher = callPattern.matcher(norm)
        if (callMatcher.find() || norm.contains("زنگ بزن") || norm.contains("تماس بگیر")) {
            val contact = if (callMatcher.find()) callMatcher.group(1)?.trim() ?: "" else ""
            return VoiceIntent(
                intentId = "MAKE_PHONE_CALL",
                rawQuery = rawQuery,
                normalizedQuery = norm,
                confidence = if (contact.isNotBlank()) 0.95f else 0.7f,
                entities = if (contact.isNotBlank()) mapOf("contactName" to contact) else emptyMap(),
                riskLevel = RiskLevel.MEDIUM,
                requiredPermission = "android.permission.CALL_PHONE",
                requiresClarification = contact.isBlank(),
                clarificationPrompt = if (contact.isBlank()) "می‌خواهید با چه کسی تماس بگیرم؟" else null
            )
        }

        // 2. SMS / Messaging
        val smsPattern = Pattern.compile("(?:به|با)\\s+([^\\s]+)\\s*(?:پیام\\s*بده|پیامک\\s*بفرست)(?:\\s*(?:که|بگو)\\s*(.+))?")
        val smsMatcher = smsPattern.matcher(norm)
        if (smsMatcher.find() || norm.contains("پیام بده") || norm.contains("پیامک")) {
            val recipient = smsMatcher.group(1)?.trim() ?: ""
            val message = smsMatcher.group(2)?.trim() ?: ""
            return VoiceIntent(
                intentId = "SEND_SMS",
                rawQuery = rawQuery,
                normalizedQuery = norm,
                confidence = if (recipient.isNotBlank()) 0.92f else 0.65f,
                entities = mapOf("recipient" to recipient, "message" to message),
                riskLevel = RiskLevel.HIGH,
                requiredPermission = "android.permission.SEND_SMS",
                requiresClarification = recipient.isBlank() || message.isBlank(),
                clarificationPrompt = if (recipient.isBlank()) "گیرنده پیام کیست؟" else if (message.isBlank()) "متن پیام برای $recipient چیست؟" else null
            )
        }

        // 3. Alarm / Timer
        if (norm.contains("بیدارم کن") || norm.contains("زنگ بذار") || norm.contains("تایمر")) {
            val dt = extractDateTime(rawQuery)
            return VoiceIntent(
                intentId = "SET_ALARM",
                rawQuery = rawQuery,
                normalizedQuery = norm,
                confidence = 0.94f,
                entities = mapOf(
                    "hour" to (dt.hour ?: 7).toString(),
                    "minute" to (dt.minute ?: 0).toString(),
                    "dateDesc" to (dt.dateDesc ?: "امروز")
                ),
                riskLevel = RiskLevel.LOW,
                requiredPermission = "com.android.alarm.permission.SET_ALARM"
            )
        }

        // 4. Memory Retention
        val memPattern = Pattern.compile("یادت\\s+(?:باشه|نره|بمونه)\\s*(.+)")
        val memMatcher = memPattern.matcher(norm)
        if (memMatcher.find()) {
            val content = memMatcher.group(1)?.trim() ?: ""
            return VoiceIntent(
                intentId = "REMEMBER_INFO",
                rawQuery = rawQuery,
                normalizedQuery = norm,
                confidence = 0.95f,
                entities = mapOf("content" to content),
                riskLevel = RiskLevel.LOW
            )
        }

        // 5. Memory Retrieval
        if (norm.contains("کجاست") || norm.contains("یادت هست") || norm.contains("یادته")) {
            return VoiceIntent(
                intentId = "RECALL_INFO",
                rawQuery = rawQuery,
                normalizedQuery = norm,
                confidence = 0.88f,
                entities = mapOf("query" to norm),
                riskLevel = RiskLevel.LOW
            )
        }

        // Default Conversation
        return VoiceIntent(
            intentId = "GENERAL_CONVERSATION",
            rawQuery = rawQuery,
            normalizedQuery = norm,
            confidence = 0.8f,
            entities = mapOf("query" to rawQuery),
            riskLevel = RiskLevel.LOW
        )
    }
}
