import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './fixture';
import { compareNotifications, countAttention, countDueSoon, isDueSoon, selectFeed } from './sorting';

const now = new Date('2026-10-14T12:00:00.000Z');

test('sorting uses severity, then deadline, then recency', () => {
  const items = [
    fixture({ id: 'low', priority: 'low', basePriority: 'low', receivedAt: '2026-10-14T11:00:00.000Z' }),
    fixture({
      id: 'urgent-later',
      priority: 'urgent',
      basePriority: 'urgent',
      deadlineAt: '2026-10-16T12:00:00.000Z',
      receivedAt: '2026-10-14T08:00:00.000Z',
    }),
    fixture({
      id: 'high-sooner',
      priority: 'high',
      basePriority: 'high',
      deadlineAt: '2026-10-14T15:00:00.000Z',
      receivedAt: '2026-10-14T09:00:00.000Z',
    }),
    fixture({
      id: 'high-later',
      priority: 'high',
      basePriority: 'high',
      deadlineAt: '2026-10-15T15:00:00.000Z',
      receivedAt: '2026-10-14T10:00:00.000Z',
    }),
    fixture({ id: 'high-new', priority: 'high', basePriority: 'high', receivedAt: '2026-10-14T11:30:00.000Z' }),
    fixture({ id: 'high-old', priority: 'high', basePriority: 'high', receivedAt: '2026-10-14T07:00:00.000Z' }),
  ];
  const ordered = [...items].sort(compareNotifications).map((item) => item.id);
  assert.deepEqual(ordered, ['urgent-later', 'high-sooner', 'high-later', 'high-new', 'high-old', 'low']);
});

test('filters and attention counts ignore handled and low items', () => {
  const items = [
    fixture({ id: 'urgent', priority: 'urgent', basePriority: 'urgent', category: 'security_alert' }),
    fixture({ id: 'reply', priority: 'high', basePriority: 'high', category: 'reply_needed', deadlineAt: '2026-10-14T18:00:00.000Z' }),
    fixture({ id: 'deadline', priority: 'high', basePriority: 'high', category: 'deadline', deadlineAt: '2026-10-15T09:00:00.000Z' }),
    fixture({ id: 'low', priority: 'low', basePriority: 'low' }),
    fixture({ id: 'done', priority: 'urgent', basePriority: 'urgent', status: 'handled' }),
  ];
  assert.equal(countAttention(items), 3);
  assert.deepEqual(selectFeed(items, 'urgent').map((item) => item.id), ['urgent']);
  assert.deepEqual(selectFeed(items, 'reply').map((item) => item.id), ['reply']);
  assert.deepEqual(selectFeed(items, 'deadlines').map((item) => item.id), ['reply', 'deadline']);
  assert.equal(selectFeed(items, 'all').length, 4);
});

test('due soon includes the 24 hour boundary and a limited overdue window', () => {
  const due = fixture({ id: 'due', deadlineAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() });
  const later = fixture({ id: 'later', deadlineAt: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 1).toISOString() });
  const overdue = fixture({ id: 'overdue', deadlineAt: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString() });
  const stale = fixture({ id: 'stale', deadlineAt: new Date(now.getTime() - 13 * 60 * 60 * 1000).toISOString() });
  const snoozed = fixture({ id: 'snoozed', status: 'snoozed', deadlineAt: new Date(now.getTime() + 60_000).toISOString() });
  assert.equal(isDueSoon(due, now), true);
  assert.equal(isDueSoon(later, now), false);
  assert.equal(isDueSoon(overdue, now), true);
  assert.equal(isDueSoon(stale, now), false);
  assert.equal(isDueSoon(snoozed, now), false);
  assert.equal(countDueSoon([due, later, overdue, stale, snoozed], now), 2);
});
