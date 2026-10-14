import type { ActivityEvent, NudgeNotification } from '../../types';
import { isInQuietHours, quietHoursEnd } from '../../utils/time';

export interface ReminderPolicy {
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  securityBypassesQuietHours: boolean;
  pauseReminders: boolean;
}

function event(notification: NudgeNotification, at: Date, createId: () => string, detail: string): ActivityEvent {
  return {
    id: createId(),
    notificationId: notification.id,
    type: 'reminder_due',
    at: at.toISOString(),
    title: notification.title,
    detail,
  };
}

function isBlocked(notification: NudgeNotification, now: Date, policy: ReminderPolicy): boolean {
  if (policy.pauseReminders) return true;
  const quiet = policy.quietHoursEnabled && isInQuietHours(now, policy.quietStart, policy.quietEnd);
  if (!quiet) return false;
  const bypass = policy.securityBypassesQuietHours && notification.category === 'security_alert';
  return !bypass;
}

export function reconcileReminders(
  notifications: NudgeNotification[],
  now: Date,
  policy: ReminderPolicy,
  createId: () => string,
): { notifications: NudgeNotification[]; events: ActivityEvent[] } {
  const events: ActivityEvent[] = [];
  const next = notifications.map((notification) => {
    const blocked = isBlocked(notification, now, policy);

    if (notification.status === 'snoozed' && notification.snoozeUntil) {
      const due = new Date(notification.snoozeUntil).getTime() <= now.getTime();
      if (!due) return notification;
      if (blocked && policy.pauseReminders) return notification;
      if (blocked) {
        const end = quietHoursEnd(now, policy.quietStart, policy.quietEnd);
        if (end.getTime() <= now.getTime()) return notification;
        const deferred = end.toISOString();
        if (notification.snoozeUntil === deferred) return notification;
        return { ...notification, snoozeUntil: deferred };
      }
      events.push(event(notification, now, createId, 'Snooze ended and the item is back in the feed.'));
      return {
        ...notification,
        status: 'pending' as const,
        snoozeUntil: null,
      };
    }

    if (
      notification.status === 'pending' &&
      notification.deadlineAt &&
      !notification.deadlineReminderFiredAt &&
      new Date(notification.deadlineAt).getTime() <= now.getTime()
    ) {
      if (blocked) return notification;
      events.push(event(notification, now, createId, 'The deadline has arrived.'));
      const escalate = notification.category !== 'general_update';
      return {
        ...notification,
        deadlineReminderFiredAt: now.toISOString(),
        priority: escalate ? 'urgent' : notification.priority,
      };
    }

    return notification;
  });

  return { notifications: next, events };
}
