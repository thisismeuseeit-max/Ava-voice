package com.voiceassistant.persian

import com.voiceassistant.persian.core.model.RiskLevel
import com.voiceassistant.persian.nlp.PersianNlpProcessor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PersianNlpTest {

    private val nlp = PersianNlpProcessor()

    @Test
    fun testPersianNormalization() {
        val raw = "علي كجاست؟"
        val norm = PersianNlpProcessor.normalizeText(raw)
        assertEquals("علی کجاست؟", norm)
    }

    @Test
    fun testCallIntentExtraction() {
        val intent = nlp.parseIntent("به علی زنگ بزن")
        assertEquals("MAKE_PHONE_CALL", intent.intentId)
        assertEquals("علی", intent.entities["contactName"])
        assertEquals(RiskLevel.MEDIUM, intent.riskLevel)
    }

    @Test
    fun testColloquialSmsIntent() {
        val intent = nlp.parseIntent("به سارا پیام بده که دیر میرسم")
        assertEquals("SEND_SMS", intent.intentId)
        assertEquals("سارا", intent.entities["recipient"])
        assertEquals("دیر میرسم", intent.entities["message"])
        assertEquals(RiskLevel.HIGH, intent.riskLevel)
    }

    @Test
    fun testAlarmExtraction() {
        val intent = nlp.parseIntent("فردا ساعت ۸ صبح بیدارم کن")
        assertEquals("SET_ALARM", intent.intentId)
        assertEquals("8", intent.entities["hour"])
        assertEquals("فردا", intent.entities["dateDesc"])
    }
}
