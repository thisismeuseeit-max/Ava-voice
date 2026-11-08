import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHubDeltaUpdater } from './deltaUpdater';
import { UpdateManifest } from './types';

test('GitHubDeltaUpdater identifies modified files and calculates delta size', () => {
  const updater = new GitHubDeltaUpdater();

  const currentManifest: UpdateManifest = {
    version: '1.0.0',
    buildNumber: 1,
    releaseDate: '2026-11-01',
    minimumSupportedVersion: '1.0.0',
    signature: 'sig_valid',
    files: [
      { filePath: 'models/wakeword.bin', fileSize: 1024, sha256: 'hash_old_model', fileType: 'MODEL', updateType: 'ADD' },
      { filePath: 'config/persian_grammar.json', fileSize: 500, sha256: 'hash_grammar_1', fileType: 'CONFIG', updateType: 'ADD' },
    ],
  };

  const remoteManifest: UpdateManifest = {
    version: '1.0.1',
    buildNumber: 2,
    releaseDate: '2026-11-08',
    minimumSupportedVersion: '1.0.0',
    signature: 'sig_valid_2',
    files: [
      { filePath: 'models/wakeword.bin', fileSize: 1024, sha256: 'hash_old_model', fileType: 'MODEL', updateType: 'ADD' },
      { filePath: 'config/persian_grammar.json', fileSize: 650, sha256: 'hash_grammar_2_new', fileType: 'CONFIG', updateType: 'MODIFY' },
    ],
  };

  const localHashes = {
    'models/wakeword.bin': 'hash_old_model',
    'config/persian_grammar.json': 'hash_grammar_1',
  };

  const delta = updater.computeDelta(currentManifest, remoteManifest, localHashes);
  assert.equal(delta.hasUpdates, true);
  assert.equal(delta.filesToDownload.length, 1);
  assert.equal(delta.filesToDownload[0].filePath, 'config/persian_grammar.json');
  assert.equal(delta.totalDownloadBytes, 650);
});

test('GitHubDeltaUpdater atomic verification rejects mismatched hash', () => {
  const updater = new GitHubDeltaUpdater();
  const manifestFiles = [
    { filePath: 'models/persian.bin', fileSize: 2048, sha256: 'correct_sha256', fileType: 'MODEL' as const, updateType: 'ADD' as const },
  ];
  const downloadedHashes = {
    'models/persian.bin': 'tampered_sha256_corrupted',
  };

  const result = updater.verifyAndApplyUpdate(downloadedHashes, manifestFiles);
  assert.equal(result.success, false);
  assert.equal(result.appliedCount, 0);
  assert.equal(result.errors.length, 1);
});
