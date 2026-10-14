import type { NudgeNotification } from '../../types';

export function fixture(overrides: Partial<NudgeNotification> & Pick<NudgeNotification, 'id'>): NudgeNotification {
  return {
    sourceId: 'gmail',
    sender: 'Sender',
    title: 'Title',
    originalText: 'Body',
    summary: 'Body',
    category: 'general_update',
    basePriority: 'normal',
    priority: 'normal',
    receivedAt: '2026-10-14T10:00:00.000Z',
    deadlineAt: null,
    timeZone: 'UTC',
    analysisReason: 'Demo analysis: no urgent action or clear deadline was found.',
    suggestedAction: 'No action is needed unless you want to read it.',
    confidence: 0.55,
    status: 'pending',
    snoozeUntil: null,
    handledAt: null,
    deadlineReminderFiredAt: null,
    isDemo: true,
    ...overrides,
  };
}
