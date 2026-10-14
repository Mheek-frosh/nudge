import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultSources } from '../sources/catalog';
import { demoIngestion } from './ingest';
import { SEED_COUNT, buildSeed, createSimulation } from './samples';

test('the demo seed is fresh, unique, and free of real secrets', () => {
  const now = new Date(2026, 9, 14, 11, 0, 0);
  const seeded = buildSeed(now, defaultSources());
  assert.equal(SEED_COUNT, 15);
  assert.equal(seeded.notifications.length, 15);
  assert.equal(seeded.activity.length, 15);
  const ids = new Set(seeded.notifications.map((item) => item.id));
  assert.equal(ids.size, 15);
  for (const item of seeded.notifications) {
    assert.equal(item.isDemo, true);
    assert.ok(new Date(item.receivedAt).getTime() <= now.getTime());
    if (item.deadlineAt) assert.ok(new Date(item.deadlineAt).getTime() > now.getTime());
    assert.equal(/\b\d{4,}\b/.test(item.originalText), false);
    assert.equal(/otp|pin|password is/i.test(item.originalText), false);
  }
  const login = seeded.notifications.find((item) => item.id === 'seed:bank-login');
  assert.equal(login?.category, 'security_alert');
  assert.equal(login?.deadlineAt, null);
  const promo = seeded.notifications.find((item) => item.id === 'seed:gmail-promo');
  assert.equal(promo?.priority, 'low');
  const brief = seeded.notifications.find((item) => item.id === 'seed:whatsapp-brief');
  assert.equal(brief?.category, 'reply_needed');
  assert.ok(brief?.deadlineAt);
});

test('disabled sources are omitted from the seed and kept out of new samples', () => {
  const now = new Date(2026, 9, 14, 11, 0, 0);
  const sources = defaultSources(['gmail']);
  const seeded = buildSeed(now, sources);
  assert.ok(seeded.notifications.every((item) => item.sourceId === 'gmail'));
  const security = createSimulation('security', now, sources, new Set(seeded.notifications.map((item) => item.id)));
  assert.equal(security.ok, false);
});

test('a two-minute sample gets a real deadline and duplicates are ignored', () => {
  const now = new Date(2026, 9, 14, 11, 0, 0);
  const sources = defaultSources();
  const created = createSimulation('due_soon', now, sources, new Set());
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const delta = new Date(created.notification.deadlineAt ?? 0).getTime() - now.getTime();
  assert.ok(delta >= 90_000 && delta <= 150_000);
  assert.equal(created.notification.priority, 'urgent');
  const duplicate = demoIngestion.ingest(
    {
      id: created.notification.id,
      sourceId: created.notification.sourceId,
      sender: created.notification.sender,
      title: created.notification.title,
      body: created.notification.originalText,
      receivedAt: created.notification.receivedAt,
    },
    { existingIds: new Set([created.notification.id]), sourcePriority: 'default', asOf: now.toISOString(), timeZone: null },
  );
  assert.equal(duplicate.status, 'duplicate');
});

test('low-priority simulator samples stay low', () => {
  const created = createSimulation('low', new Date(2026, 9, 14, 11, 0, 0), defaultSources(), new Set());
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.notification.priority, 'low');
  assert.equal(created.notification.deadlineAt, null);
});
