import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePersianText, parsePersianIntent, extractPersianDateTime } from './persianNlp';

test('normalizePersianText converts Arabic Yeh/Kaf and Persian numerals', () => {
  const raw = 'علي كجاست؟ ساعت ۱۰:۳۰ صبح';
  const normalized = normalizePersianText(raw);
  assert.equal(normalized.includes('علی'), true);
  assert.equal(normalized.includes('کجاست'), true);
  assert.equal(normalized.includes('10:30'), true);
});

test('parsePersianIntent accurately identifies phone call intent with entities', () => {
  const result = parsePersianIntent('به علی زنگ بزن');
  assert.equal(result.intent, 'MAKE_PHONE_CALL');
  assert.equal(result.entities.contactName, 'علی');
  assert.equal(result.riskLevel, 'MEDIUM');
  assert.equal(result.requiredPermission, 'android.permission.CALL_PHONE');
});

test('parsePersianIntent handles colloquial SMS intent with message', () => {
  const result = parsePersianIntent('به سارا پیام بده که دیر میرسم');
  assert.equal(result.intent, 'SEND_SMS');
  assert.equal(result.entities.recipient, 'سارا');
  assert.equal(result.entities.message, 'دیر میرسم');
  assert.equal(result.riskLevel, 'HIGH');
  assert.equal(result.requiredPermission, 'android.permission.SEND_SMS');
});

test('parsePersianIntent extracts alarm and relative time', () => {
  const result = parsePersianIntent('فردا ساعت ۸ صبح بیدارم کن');
  assert.equal(result.intent, 'SET_ALARM');
  assert.equal(result.entities.hour, 8);
  assert.equal(result.entities.dateDescription, 'فردا');
});

test('parsePersianIntent handles memory retention', () => {
  const result = parsePersianIntent('یادت باشه کلید رو گذاشتم روی میز');
  assert.equal(result.intent, 'REMEMBER_INFO');
  assert.equal(result.entities.content, 'کلید رو گذاشتم روی میز');
});

test('extractPersianDateTime parses relative hours correctly', () => {
  const dt = extractPersianDateTime('دو ساعت دیگه یادآوری کن');
  assert.equal(dt.relativeHours, 2);
});
