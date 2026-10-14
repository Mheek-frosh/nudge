import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from '../notifications/fixture';
import { reconcileReminders, type ReminderPolicy } from './engine';

const policy: ReminderPolicy = {
  quietHoursEnabled: true,
  quietStart: '22:00',
  quietEnd: '07:00',
  securityBypassesQuietHours: true,
  pauseReminders: false,
};

function ids() {
  let n = 0;
  return () => `event-${n++}`;
}

test('a due snooze returns once and does not repeat', () => {
  const now = new Date(2026, 9, 14, 15, 0, 0);
  const item = fixture({
    id: 'snooze',
    status: 'snoozed',
    priority: 'high',
    snoozeUntil: new Date(2026, 9, 14, 14, 0, 0).toISOString(),
  });
  const first = reconcileReminders([item], now, { ...policy, quietHoursEnabled: false }, ids());
  assert.equal(first.notifications[0]?.status, 'pending');
  assert.equal(first.notifications[0]?.snoozeUntil, null);
  assert.equal(first.notifications[0]?.priority, 'high');
  assert.equal(first.events.length, 1);
  const second = reconcileReminders(first.notifications, now, { ...policy, quietHoursEnabled: false }, ids());
  assert.equal(second.events.length, 0);
  assert.equal(second.notifications[0]?.status, 'pending');
});

test('future snoozes stay put', () => {
  const now = new Date(2026, 9, 14, 15, 0, 0);
  const item = fixture({
    id: 'later',
    status: 'snoozed',
    snoozeUntil: new Date(2026, 9, 14, 16, 0, 0).toISOString(),
  });
  const result = reconcileReminders([item], now, policy, ids());
  assert.equal(result.events.length, 0);
  assert.equal(result.notifications[0]?.status, 'snoozed');
});

test('overnight quiet hours defer an ordinary reminder to 7:00', () => {
  const now = new Date(2026, 9, 14, 23, 30, 15);
  const item = fixture({
    id: 'quiet',
    category: 'reply_needed',
    status: 'snoozed',
    snoozeUntil: new Date(2026, 9, 14, 23, 0, 0).toISOString(),
  });
  const deferred = reconcileReminders([item], now, policy, ids());
  assert.equal(deferred.events.length, 0);
  assert.equal(deferred.notifications[0]?.status, 'snoozed');
  const until = new Date(deferred.notifications[0]?.snoozeUntil ?? '');
  assert.equal(until.getDate(), 15);
  assert.equal(until.getHours(), 7);
  assert.equal(until.getMinutes(), 0);

  const again = reconcileReminders(deferred.notifications, now, policy, ids());
  assert.equal(again.events.length, 0);
  assert.equal(again.notifications[0]?.snoozeUntil, deferred.notifications[0]?.snoozeUntil);

  const morning = new Date(2026, 9, 15, 7, 0, 1);
  const surfaced = reconcileReminders(deferred.notifications, morning, policy, ids());
  assert.equal(surfaced.notifications[0]?.status, 'pending');
  assert.equal(surfaced.events.length, 1);
});

test('security alerts can bypass quiet hours', () => {
  const now = new Date(2026, 9, 14, 23, 30, 0);
  const item = fixture({
    id: 'security',
    category: 'security_alert',
    priority: 'urgent',
    basePriority: 'urgent',
    status: 'snoozed',
    snoozeUntil: new Date(2026, 9, 14, 23, 0, 0).toISOString(),
  });
  const bypass = reconcileReminders([item], now, policy, ids());
  assert.equal(bypass.notifications[0]?.status, 'pending');
  const held = reconcileReminders([item], now, { ...policy, securityBypassesQuietHours: false }, ids());
  assert.equal(held.notifications[0]?.status, 'snoozed');
});

test('pause holds reminders without creating events', () => {
  const now = new Date(2026, 9, 14, 23, 30, 0);
  const item = fixture({
    id: 'paused',
    status: 'snoozed',
    snoozeUntil: new Date(2026, 9, 14, 23, 0, 0).toISOString(),
  });
  const result = reconcileReminders([item], now, { ...policy, pauseReminders: true }, ids());
  assert.equal(result.events.length, 0);
  assert.equal(result.notifications[0]?.status, 'snoozed');
  assert.equal(result.notifications[0]?.snoozeUntil, item.snoozeUntil);
});

test('a passed deadline fires one reminder and keeps unknown deadlines quiet', () => {
  const now = new Date(2026, 9, 14, 16, 0, 0);
  const due = fixture({
    id: 'due',
    category: 'deadline',
    priority: 'high',
    deadlineAt: new Date(2026, 9, 14, 15, 30, 0).toISOString(),
  });
  const unknown = fixture({ id: 'unknown', category: 'deadline', deadlineAt: null });
  const first = reconcileReminders([due, unknown], now, { ...policy, quietHoursEnabled: false }, ids());
  assert.equal(first.events.length, 1);
  assert.equal(first.events[0]?.notificationId, 'due');
  assert.equal(first.notifications[0]?.priority, 'urgent');
  assert.ok(first.notifications[0]?.deadlineReminderFiredAt);
  assert.equal(first.notifications[1]?.deadlineReminderFiredAt, null);
  const second = reconcileReminders(first.notifications, now, { ...policy, quietHoursEnabled: false }, ids());
  assert.equal(second.events.length, 0);
});

test('quiet hours hold an ordinary deadline reminder', () => {
  const now = new Date(2026, 9, 14, 23, 10, 0);
  const due = fixture({
    id: 'held',
    category: 'deadline',
    deadlineAt: new Date(2026, 9, 14, 23, 0, 0).toISOString(),
  });
  const result = reconcileReminders([due], now, policy, ids());
  assert.equal(result.events.length, 0);
  assert.equal(result.notifications[0]?.deadlineReminderFiredAt, null);
});
