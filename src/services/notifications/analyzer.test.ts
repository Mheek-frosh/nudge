import assert from 'node:assert/strict';
import { test } from 'node:test';
import { demoNotificationAnalyzer } from './analyzer';

const receivedAt = '2026-10-14T12:00:00.000Z';

function analyze(body: string, explicitDeadline?: string | null, asOf = receivedAt) {
  return demoNotificationAnalyzer.analyze({
    sourceId: 'gmail',
    sender: 'Alex',
    title: 'Note',
    body,
    receivedAt,
    asOf,
    explicitDeadline,
  });
}

test('security wording is urgent and does not invent a deadline', () => {
  const result = analyze('An unfamiliar login was blocked on a new device. This sample has no account number.');
  assert.equal(result.category, 'security_alert');
  assert.equal(result.priority, 'urgent');
  assert.equal(result.deadlineAt, null);
  assert.match(result.reason, /Demo analysis/);
});

test('password reset stays a security alert', () => {
  const result = analyze('A password reset was requested. This sample has no reset code.');
  assert.equal(result.category, 'security_alert');
  assert.equal(result.priority, 'urgent');
});

test('vague reply wording does not invent a deadline', () => {
  const result = analyze('Can you send this soon?');
  assert.equal(result.category, 'reply_needed');
  assert.equal(result.priority, 'high');
  assert.equal(result.deadlineAt, null);
  assert.match(result.reason, /too vague|waiting on a response/);
});

test('explicit deadline is kept and a near one becomes urgent', () => {
  const deadline = '2026-10-14T13:00:00.000Z';
  const result = analyze('Can you send the Q3 brief before 3?', deadline, '2026-10-14T12:10:00.000Z');
  assert.equal(result.category, 'reply_needed');
  assert.equal(result.deadlineAt, deadline);
  assert.equal(result.priority, 'urgent');
});

test('a later explicit deadline stays high rather than urgent', () => {
  const deadline = '2026-10-16T17:00:00.000Z';
  const result = analyze('Please confirm you can attend the product interview.', deadline);
  assert.equal(result.priority, 'high');
  assert.equal(result.deadlineAt, deadline);
});

test('approval text with an explicit deadline is a deadline', () => {
  const deadline = '2026-10-15T12:00:00.000Z';
  const result = analyze('The studio invoice is waiting for your approval.', deadline);
  assert.equal(result.category, 'deadline');
  assert.equal(result.priority, 'high');
  assert.equal(result.deadlineAt, deadline);
});

test('ambiguous deadline language stays unknown', () => {
  const result = analyze('Please handle the form by end of day.');
  assert.equal(result.category, 'deadline');
  assert.equal(result.deadlineAt, null);
  assert.equal(result.priority, 'normal');
  assert.match(result.reason, /no exact deadline/);
});

test('invalid explicit deadlines are ignored', () => {
  const result = analyze('The studio invoice is waiting for your approval.', 'not-a-date');
  assert.equal(result.deadlineAt, null);
});

test('promotions stay low priority', () => {
  const result = analyze('Enjoy 20% off selected items this weekend. This is a promotion.');
  assert.equal(result.category, 'general_update');
  assert.equal(result.priority, 'low');
  assert.equal(result.deadlineAt, null);
});

test('ordinary updates are not promoted', () => {
  const delivery = analyze('Your parcel is out for delivery today. The courier did not share a delivery window.');
  assert.equal(delivery.category, 'general_update');
  assert.equal(delivery.priority, 'normal');
  assert.equal(delivery.deadlineAt, null);
  const casual = analyze('People are bringing salads. No need to reply unless you want a ride.');
  assert.equal(casual.priority, 'low');
});
