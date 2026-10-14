import type { FeedFilter, NudgeNotification, Priority } from '../../types';

const RANK: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const DUE_SOON_MS = 24 * 60 * 60 * 1000;
const OVERDUE_WINDOW_MS = 12 * 60 * 60 * 1000;

export function compareNotifications(a: NudgeNotification, b: NudgeNotification): number {
  const byPriority = RANK[a.priority] - RANK[b.priority];
  if (byPriority !== 0) return byPriority;
  const aDeadline = a.deadlineAt ? new Date(a.deadlineAt).getTime() : Number.POSITIVE_INFINITY;
  const bDeadline = b.deadlineAt ? new Date(b.deadlineAt).getTime() : Number.POSITIVE_INFINITY;
  if (aDeadline !== bDeadline) return aDeadline - bDeadline;
  return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
}

export function needsAttention(notification: NudgeNotification): boolean {
  return notification.status === 'pending' && (notification.priority === 'urgent' || notification.priority === 'high');
}

export function isDueSoon(notification: NudgeNotification, now: Date): boolean {
  if (notification.status !== 'pending' || !notification.deadlineAt) return false;
  const delta = new Date(notification.deadlineAt).getTime() - now.getTime();
  return delta <= DUE_SOON_MS && delta > -OVERDUE_WINDOW_MS;
}

export function matchesFilter(notification: NudgeNotification, filter: FeedFilter): boolean {
  if (notification.status !== 'pending') return false;
  switch (filter) {
    case 'all':
      return true;
    case 'urgent':
      return notification.priority === 'urgent';
    case 'reply':
      return notification.category === 'reply_needed';
    case 'deadlines':
      return notification.category === 'deadline' || notification.deadlineAt !== null;
  }
}

export function selectFeed(items: NudgeNotification[], filter: FeedFilter): NudgeNotification[] {
  return items.filter((item) => matchesFilter(item, filter)).sort(compareNotifications);
}

export function countAttention(items: NudgeNotification[]): number {
  return items.filter(needsAttention).length;
}

export function countDueSoon(items: NudgeNotification[], now: Date): number {
  return items.filter((item) => isDueSoon(item, now)).length;
}

export function comingUp(items: NudgeNotification[], now: Date): NudgeNotification[] {
  return items
    .filter((item) => {
      if (item.status !== 'pending' && item.status !== 'snoozed') return false;
      if (!item.deadlineAt) return false;
      return new Date(item.deadlineAt).getTime() > now.getTime();
    })
    .sort((a, b) => new Date(a.deadlineAt ?? 0).getTime() - new Date(b.deadlineAt ?? 0).getTime())
    .slice(0, 4);
}

export function topPending(items: NudgeNotification[], limit = 3): NudgeNotification[] {
  return items.filter((item) => item.status === 'pending').sort(compareNotifications).slice(0, limit);
}
