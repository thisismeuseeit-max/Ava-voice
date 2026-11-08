import { UpdateManifest, ManifestFileEntry } from './types';

export interface DeltaComparisonResult {
  hasUpdates: boolean;
  filesToDownload: ManifestFileEntry[];
  filesToDelete: string[];
  totalDownloadBytes: number;
  newVersion: string;
}

export class GitHubDeltaUpdater {
  /**
   * Compares currently installed assets with the new remote manifest
   */
  public computeDelta(
    currentManifest: UpdateManifest | null,
    remoteManifest: UpdateManifest,
    localFileHashes: Record<string, string> // filePath -> sha256
  ): DeltaComparisonResult {
    // If no current manifest, everything needs to be downloaded
    if (!currentManifest) {
      const filesToDownload = remoteManifest.files.filter(f => f.updateType !== 'DELETE');
      const totalBytes = filesToDownload.reduce((acc, f) => acc + f.fileSize, 0);
      return {
        hasUpdates: true,
        filesToDownload,
        filesToDelete: [],
        totalDownloadBytes: totalBytes,
        newVersion: remoteManifest.version,
      };
    }

    // Version comparison
    if (remoteManifest.buildNumber <= currentManifest.buildNumber) {
      return {
        hasUpdates: false,
        filesToDownload: [],
        filesToDelete: [],
        totalDownloadBytes: 0,
        newVersion: currentManifest.version,
      };
    }

    const filesToDownload: ManifestFileEntry[] = [];
    const filesToDelete: string[] = [];

    for (const remoteFile of remoteManifest.files) {
      if (remoteFile.updateType === 'DELETE') {
        filesToDelete.push(remoteFile.filePath);
        continue;
      }

      const localHash = localFileHashes[remoteFile.filePath];
      // If local file is missing or has a different SHA-256 hash, mark for download
      if (!localHash || localHash !== remoteFile.sha256) {
        filesToDownload.push(remoteFile);
      }
    }

    const totalDownloadBytes = filesToDownload.reduce((acc, f) => acc + f.fileSize, 0);

    return {
      hasUpdates: filesToDownload.length > 0 || filesToDelete.length > 0,
      filesToDownload,
      filesToDelete,
      totalDownloadBytes,
      newVersion: remoteManifest.version,
    };
  }

  /**
   * Simulates atomic replacement with rollback capability
   */
  public verifyAndApplyUpdate(
    downloadedHashes: Record<string, string>,
    manifestFiles: ManifestFileEntry[]
  ): { success: boolean; appliedCount: number; errors: string[] } {
    const errors: string[] = [];
    let appliedCount = 0;

    for (const file of manifestFiles) {
      if (file.updateType === 'DELETE') continue;
      const actualHash = downloadedHashes[file.filePath];
      if (!actualHash || actualHash !== file.sha256) {
        errors.push(`هش فایل ${file.filePath} با مانیفست همخوانی ندارد. انتظار: ${file.sha256}، دریافت: ${actualHash}`);
      } else {
        appliedCount++;
      }
    }

    if (errors.length > 0) {
      // Atomic failure: rollback all
      return {
        success: false,
        appliedCount: 0,
        errors,
      };
    }

    return {
      success: true,
      appliedCount,
      errors: [],
    };
  }
}
