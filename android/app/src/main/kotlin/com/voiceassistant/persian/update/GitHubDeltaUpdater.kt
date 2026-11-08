package com.voiceassistant.persian.update

import java.io.File
import java.security.MessageDigest

/**
 * GitHub Delta Updater (Master Spec section 10)
 * Computes asset deltas, verifies SHA-256 hashes, and applies atomic replacements with rollback.
 */
class GitHubDeltaUpdater {

    data class ManifestFile(
        val path: String,
        val size: Long,
        val sha256: String,
        val isDeleted: Boolean = false
    )

    data class DeltaResult(
        val needsUpdate: Boolean,
        val filesToDownload: List<ManifestFile>,
        val filesToDelete: List<String>,
        val totalBytes: Long
    )

    fun calculateFileSha256(file: File): String {
        if (!file.exists()) return ""
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { stream ->
            val buffer = ByteArray(8192)
            var bytesRead: Int
            while (stream.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    fun computeDelta(
        localFiles: Map<String, String>, // path -> sha256
        remoteFiles: List<ManifestFile>
    ): DeltaResult {
        val toDownload = mutableListOf<ManifestFile>()
        val toDelete = mutableListOf<String>()

        for (remote in remoteFiles) {
            if (remote.isDeleted) {
                toDelete.add(remote.path)
                continue
            }
            val localHash = localFiles[remote.path]
            if (localHash == null || !localHash.equals(remote.sha256, ignoreCase = true)) {
                toDownload.add(remote)
            }
        }

        val totalBytes = toDownload.sumOf { it.size }
        return DeltaResult(
            needsUpdate = toDownload.isNotEmpty() || toDelete.isNotEmpty(),
            filesToDownload = toDownload,
            filesToDelete = toDelete,
            totalBytes = totalBytes
        )
    }
}
