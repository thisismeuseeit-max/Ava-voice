package com.voiceassistant.persian.core.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Keystore Manager (Master Spec section 9.1 & 9.6)
 * Encrypts sensitive user memories and preference keys using AES-256 GCM backed by Android Keystore.
 */
class KeystoreManager(context: Context) {

    private val masterKey: MasterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val securePreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "ava_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun putSecureString(key: String, value: String) {
        securePreferences.edit().putString(key, value).apply()
    }

    fun getSecureString(key: String, defaultValue: String? = null): String? {
        return securePreferences.getString(key, defaultValue)
    }

    fun removeSecureKey(key: String) {
        securePreferences.edit().remove(key).apply()
    }

    fun clearAllSecureData() {
        securePreferences.edit().clear().apply()
    }
}
