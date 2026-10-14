import type { ActivityEvent, IngestContext, IngestResult, IncomingNotification, NotificationIngestion } from '../../types';
import { demoNotificationAnalyzer } from './analyzer';
import { applySourcePriority } from './priority';

function eventId(notificationId: string, at: string): string {
  return `act:received:${notificationId}:${at}`;
}

export const demoIngestion: NotificationIngestion = {
  ingest(input: IncomingNotification, context: IngestContext): IngestResult {
    if (context.existingIds.has(input.id)) return { status: 'duplicate' };

    const analysis = demoNotificationAnalyzer.analyze({
      sourceId: input.sourceId,
      sender: input.sender,
      title: input.title,
      body: input.body,
      receivedAt: input.receivedAt,
      asOf: context.asOf,
      explicitDeadline: input.explicitDeadline,
    });
    const priority = applySourcePriority(analysis.priority, context.sourcePriority, analysis.category);
    const timeZone = input.timeZone ?? context.timeZone;

    const notification = {
      id: input.id,
      sourceId: input.sourceId,
      sender: input.sender,
      title: input.title,
      originalText: input.body,
      summary: analysis.summary,
      category: analysis.category,
      basePriority: analysis.priority,
      priority,
      receivedAt: input.receivedAt,
      deadlineAt: analysis.deadlineAt,
      timeZone,
      analysisReason: analysis.reason,
      suggestedAction: analysis.suggestedAction,
      confidence: analysis.confidence,
      status: 'pending' as const,
      snoozeUntil: null,
      handledAt: null,
      deadlineReminderFiredAt: null,
      isDemo: true as const,
    };

    const event: ActivityEvent = {
      id: eventId(input.id, input.receivedAt),
      notificationId: input.id,
      type: 'received',
      at: input.receivedAt,
      title: input.title,
      detail: 'Demo notification received',
    };

    return { status: 'created', notification, event };
  },
};
