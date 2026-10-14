import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attentionSummary, isInQuietHours, nextLocalTime, quietHoursEnd, tomorrowMorning } from './time';

test('overnight quiet hours cover late night and early morning', () => {
  const late = new Date(2026, 9, 14, 23, 30, 0);
  const early = new Date(2026, 9, 15, 6, 15, 0);
  const morning = new Date(2026, 9, 15, 7, 0, 0);
  const noon = new Date(2026, 9, 14, 12, 0, 0);
  const start = new Date(2026, 9, 14, 22, 0, 0);
  assert.equal(isInQuietHours(late, '22:00', '07:00'), true);
  assert.equal(isInQuietHours(early, '22:00', '07:00'), true);
  assert.equal(isInQuietHours(start, '22:00', '07:00'), true);
  assert.equal(isInQuietHours(morning, '22:00', '07:00'), false);
  assert.equal(isInQuietHours(noon, '22:00', '07:00'), false);
});

test('same-day quiet hours stay inside the window', () => {
  assert.equal(isInQuietHours(new Date(2026, 9, 14, 12, 0), '09:00', '17:00'), true);
  assert.equal(isInQuietHours(new Date(2026, 9, 14, 8, 59), '09:00', '17:00'), false);
  assert.equal(isInQuietHours(new Date(2026, 9, 14, 17, 0), '09:00', '17:00'), false);
  assert.equal(isInQuietHours(new Date(2026, 9, 14, 9, 0), '09:00', '09:00'), false);
});

test('quiet end lands on the next morning after midnight', () => {
  const now = new Date(2026, 9, 14, 23, 30, 15);
  const end = quietHoursEnd(now, '22:00', '07:00');
  assert.equal(end.getFullYear(), 2026);
  assert.equal(end.getMonth(), 9);
  assert.equal(end.getDate(), 15);
  assert.equal(end.getHours(), 7);
  assert.equal(end.getMinutes(), 0);
});

test('quiet end stays on the same morning before 7', () => {
  const end = quietHoursEnd(new Date(2026, 9, 15, 2, 0, 0), '22:00', '07:00');
  assert.equal(end.getDate(), 15);
  assert.equal(end.getHours(), 7);
});

test('next local time rolls forward when it is too close', () => {
  const now = new Date(2026, 9, 14, 14, 40, 0);
  const next = nextLocalTime(now, 15, 0);
  assert.equal(next.getDate(), 15);
  assert.equal(next.getHours(), 15);
});

test('tomorrow morning is the next calendar morning', () => {
  const morning = tomorrowMorning(new Date(2026, 9, 14, 23, 10, 0));
  assert.equal(morning.getDate(), 15);
  assert.equal(morning.getHours(), 8);
  assert.equal(morning.getMinutes(), 0);
});

test('attention summary uses singular and empty copy', () => {
  assert.equal(attentionSummary(0, 0), 'Nothing needs attention right now');
  assert.equal(attentionSummary(1, 1), '1 needs attention · 1 due soon');
  assert.equal(attentionSummary(3, 2), '3 need attention · 2 due soon');
});
