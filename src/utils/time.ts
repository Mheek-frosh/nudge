const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function parseClock(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function isInQuietHours(now: Date, start: string, end: string): boolean {
  const startMinutes = parseClock(start);
  const endMinutes = parseClock(end);
  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (startMinutes < endMinutes) {
    return minutes >= startMinutes && minutes < endMinutes;
  }
  return minutes >= startMinutes || minutes < endMinutes;
}

/** Next quiet-hours end. Call this while quiet hours are active. */
export function quietHoursEnd(now: Date, _start: string, end: string): Date {
  const endMinutes = parseClock(end) ?? 7 * 60;
  const result = new Date(now);
  result.setSeconds(0, 0);
  result.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
  if (result.getTime() <= now.getTime()) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

export function addMinutes(now: Date, minutes: number): Date {
  return new Date(now.getTime() + minutes * MINUTE);
}

export function tomorrowMorning(now: Date, hour = 8, minute = 0): Date {
  const result = new Date(now);
  result.setDate(result.getDate() + 1);
  result.setHours(hour, minute, 0, 0);
  return result;
}

/** Next local clock time. If it is under minLeadMs away, use the following day. */
export function nextLocalTime(now: Date, hour: number, minute: number, minLeadMs = 30 * MINUTE): Date {
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);
  if (result.getTime() - now.getTime() < minLeadMs) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

export function daysFromNowAt(now: Date, days: number, hour: number, minute: number): Date {
  const result = new Date(now);
  result.setDate(result.getDate() + days);
  result.setHours(hour, minute, 0, 0);
  return result;
}

export function deviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatFullDate(now: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatReceived(iso: string, now: Date): string {
  const delta = now.getTime() - new Date(iso).getTime();
  if (Number.isNaN(delta)) return '';
  if (delta < MINUTE) return 'Just now';
  if (delta < HOUR) return `${Math.round(delta / MINUTE)}m ago`;
  if (delta < DAY) return `${Math.round(delta / HOUR)}h ago`;
  const days = Math.round((startOfLocalDay(now).getTime() - startOfLocalDay(new Date(iso)).getTime()) / DAY);
  if (days === 1) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(iso));
}

export function formatCountdown(deadlineIso: string, now: Date): string {
  const delta = new Date(deadlineIso).getTime() - now.getTime();
  if (Number.isNaN(delta)) return 'Deadline unknown';
  const abs = Math.abs(delta);
  if (delta < 0) {
    if (abs < MINUTE) return 'Overdue';
    if (abs < HOUR) return `Overdue ${Math.max(1, Math.round(abs / MINUTE))}m`;
    if (abs < DAY) return `Overdue ${Math.round(abs / HOUR)}h`;
    return `Overdue · ${formatShortWhen(deadlineIso, now)}`;
  }
  if (abs < MINUTE) return 'Due now';
  if (abs < HOUR) return `Due in ${Math.max(1, Math.round(abs / MINUTE))}m`;
  if (abs < 6 * HOUR) return `Due in ${Math.round(abs / HOUR)}h`;
  return `Due ${formatShortWhen(deadlineIso, now)}`;
}

export function formatShortWhen(iso: string, now: Date): string {
  const date = new Date(iso);
  const dayDelta = Math.round((startOfLocalDay(date).getTime() - startOfLocalDay(now).getTime()) / DAY);
  const time = formatTime(iso);
  if (dayDelta === 0) return `today, ${time}`;
  if (dayDelta === 1) return `tomorrow, ${time}`;
  const day = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  return `${day}, ${time}`;
}

export function formatDeadlineDetail(iso: string, timeZone: string | null): string {
  const when = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
  return `${when} · ${timeZone ?? 'Device time'}`;
}

export function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function dayLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  const diff = Math.round((startOfLocalDay(now).getTime() - startOfLocalDay(date).getTime()) / DAY);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function attentionSummary(attention: number, dueSoon: number): string {
  if (attention === 0 && dueSoon === 0) return 'Nothing needs attention right now';
  const attentionLabel = attention === 1 ? '1 needs attention' : `${attention} need attention`;
  const dueLabel = dueSoon === 1 ? '1 due soon' : `${dueSoon} due soon`;
  return `${attentionLabel} · ${dueLabel}`;
}
