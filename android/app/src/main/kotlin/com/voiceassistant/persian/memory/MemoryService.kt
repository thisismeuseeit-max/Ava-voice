package com.voiceassistant.persian.memory

import com.voiceassistant.persian.core.model.MemoryCategory
import com.voiceassistant.persian.core.model.MemoryRecord
import com.voiceassistant.persian.core.security.KeystoreManager
import java.util.UUID
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Memory Service (Master Spec section 6)
 * Supports Short-term context, Long-term preferences, Episodic records, and GDPR user erasure.
 */
class MemoryService(private val keystoreManager: KeystoreManager) {

    private val records = CopyOnWriteArrayList<MemoryRecord>()

    fun remember(category: MemoryCategory, key: String, value: String, confidence: Float = 0.95f): MemoryRecord {
        val record = MemoryRecord(
            id = UUID.randomUUID().toString(),
            category = category,
            key = key,
            value = value,
            confidence = confidence
        )
        // Store sensitive preference in encrypted keystore
        if (category == MemoryCategory.PREFERENCE) {
            keystoreManager.putSecureString("mem_$key", value)
        }
        records.add(record)
        return record
    }

    fun recall(query: String): List<MemoryRecord> {
        val q = query.lowercase()
        return records.filter { it.key.lowercase().contains(q) || it.value.lowercase().contains(q) }
    }

    fun getAllRecords(): List<MemoryRecord> = records.toList()

    fun deleteRecord(id: String): Boolean {
        val target = records.find { it.id == id } ?: return false
        if (target.category == MemoryCategory.PREFERENCE) {
            keystoreManager.removeSecureKey("mem_${target.key}")
        }
        return records.remove(target)
    }

    /**
     * Complete wipe of all user memory (GDPR compliance)
     */
    fun clearAllMemory() {
        records.clear()
        keystoreManager.clearAllSecureData()
    }
}
