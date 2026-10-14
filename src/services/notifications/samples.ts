import type { ActivityEvent, NudgeNotification, SimulationKind, SourceConfig, SourceId } from '../../types';
import { deviceTimeZone, daysFromNowAt, nextLocalTime, addMinutes } from '../../utils/time';
import { demoIngestion } from './ingest';

interface Draft {
  id: string;
  sourceId: SourceId;
  sender: string;
  title: string;
  body: string;
  minutesAgo: number;
  deadline?: (now: Date) => Date;
}

const SEED_DRAFTS: Draft[] = [
  {
    id: 'seed:whatsapp-brief',
    sourceId: 'whatsapp',
    sender: 'Amira Okonkwo',
    title: 'Q3 brief before 3',
    body: 'Can you send the Q3 brief before 3? I need it for the client call.',
    minutesAgo: 25,
    deadline: (now) => nextLocalTime(now, 15, 0),
  },
  {
    id: 'seed:gmail-interview',
    sourceId: 'gmail',
    sender: 'Northwind Talent',
    title: 'Interview confirmation',
    body: 'Please confirm you can attend the product interview. Reply with a time that works.',
    minutesAgo: 80,
    deadline: (now) => daysFromNowAt(now, 2, 17, 0),
  },
  {
    id: 'seed:outlook-invoice',
    sourceId: 'outlook',
    sender: 'Finance Operations',
    title: 'Invoice needs approval',
    body: 'The studio invoice is waiting for your approval.',
    minutesAgo: 50,
    deadline: (now) => daysFromNowAt(now, 1, 12, 0),
  },
  {
    id: 'seed:telegram-picnic',
    sourceId: 'telegram',
    sender: 'Weekend plans',
    title: 'Saturday picnic',
    body: 'People are bringing salads. No need to reply unless you want a ride.',
    minutesAgo: 180,
  },
  {
    id: 'seed:slack-review',
    sourceId: 'slack',
    sender: 'Jordan Lee',
    title: 'Review the launch notes',
    body: 'Could you review the launch notes before our meeting?',
    minutesAgo: 18,
    deadline: (now) => addMinutes(now, 180),
  },
  {
    id: 'seed:bank-login',
    sourceId: 'banking',
    sender: 'Harbor Mutual',
    title: 'Unfamiliar login',
    body: 'An unfamiliar login was blocked on a device you have not used before. This sample has no account number.',
    minutesAgo: 8,
  },
  {
    id: 'seed:bank-reset',
    sourceId: 'banking',
    sender: 'Harbor Mutual',
    title: 'Password reset requested',
    body: 'A password reset was requested. If this was not you, review it in your bank\'s own app. This sample has no reset code.',
    minutesAgo: 40,
  },
  {
    id: 'seed:gmail-delivery',
    sourceId: 'gmail',
    sender: 'Parcel North',
    title: 'Out for delivery',
    body: 'Your parcel is out for delivery today. The courier did not share a delivery window.',
    minutesAgo: 70,
  },
  {
    id: 'seed:gmail-promo',
    sourceId: 'gmail',
    sender: 'Field & Co.',
    title: 'Weekend offer',
    body: 'Enjoy 20% off selected items this weekend. This is a promotion.',
    minutesAgo: 300,
  },
  {
    id: 'seed:whatsapp-agenda',
    sourceId: 'whatsapp',
    sender: 'Samir Adeyemi',
    title: 'Draft agenda',
    body: 'Are you free to look at the draft agenda before lunch?',
    minutesAgo: 12,
    deadline: (now) => nextLocalTime(now, 12, 30),
  },
  {
    id: 'seed:outlook-critique',
    sourceId: 'outlook',
    sender: 'Design studio',
    title: 'Critique tomorrow',
    body: 'Design critique is on the calendar. Bring the latest screens.',
    minutesAgo: 240,
    deadline: (now) => daysFromNowAt(now, 1, 10, 0),
  },
  {
    id: 'seed:slack-lunch',
    sourceId: 'slack',
    sender: '#general',
    title: 'Friday lunch poll',
    body: 'Voting is open for Friday lunch. Nothing is blocked on you.',
    minutesAgo: 360,
  },
  {
    id: 'seed:gmail-contract',
    sourceId: 'gmail',
    sender: 'Legal Ops',
    title: 'NDA signature',
    body: 'The mutual NDA is ready when you are. Please sign before the date on the request.',
    minutesAgo: 90,
    deadline: (now) => daysFromNowAt(now, 3, 16, 0),
  },
  {
    id: 'seed:telegram-late',
    sourceId: 'telegram',
    sender: 'Lina Costa',
    title: 'Running late',
    body: 'I will be about ten minutes late to coffee. Start without me.',
    minutesAgo: 60,
  },
  {
    id: 'seed:bank-statement',
    sourceId: 'banking',
    sender: 'Harbor Mutual',
    title: 'Statement ready',
    body: 'Your monthly statement is ready to view in the bank\'s own app. This sample does not include balances or account details.',
    minutesAgo: 480,
  },
];

interface SimTemplate {
  sourceId: SourceId;
  sender: string;
  title: string;
  body: string;
  deadline?: (now: Date) => Date;
}

const RANDOM_TEMPLATES: SimTemplate[] = [
  {
    sourceId: 'whatsapp',
    sender: 'Noah Mensah',
    title: 'Notes link',
    body: 'Can you share the link to the notes when you have a moment?',
  },
  {
    sourceId: 'outlook',
    sender: 'People Ops',
    title: 'Travel receipt',
    body: 'The travel receipt is waiting for your approval.',
    deadline: (now) => daysFromNowAt(now, 2, 11, 0),
  },
  {
    sourceId: 'telegram',
    sender: 'Neighbours',
    title: 'Dinner moved',
    body: 'The group moved dinner to 7. No need to reply if you already saw it.',
  },
  {
    sourceId: 'slack',
    sender: 'Riley Chen',
    title: 'Deck check',
    body: 'Could you glance at the deck before we present?',
    deadline: (now) => addMinutes(now, 240),
  },
  {
    sourceId: 'gmail',
    sender: 'Northline',
    title: 'Another parcel',
    body: 'Your parcel from Northline is out for delivery today. No delivery window was given.',
  },
];

function sourcePriority(sources: SourceConfig[], id: SourceId) {
  return sources.find((source) => source.id === id)?.priority ?? 'default';
}

function sourceEnabled(sources: SourceConfig[], id: SourceId): boolean {
  return sources.find((source) => source.id === id)?.enabled ?? false;
}

function materialize(
  draft: {
    id: string;
    sourceId: SourceId;
    sender: string;
    title: string;
    body: string;
    receivedAt: string;
    deadline?: (now: Date) => Date;
  },
  now: Date,
  sources: SourceConfig[],
  existingIds: Set<string>,
): { notification: NudgeNotification; event: ActivityEvent } | null {
  const result = demoIngestion.ingest(
    {
      id: draft.id,
      sourceId: draft.sourceId,
      sender: draft.sender,
      title: draft.title,
      body: draft.body,
      receivedAt: draft.receivedAt,
      explicitDeadline: draft.deadline ? draft.deadline(now).toISOString() : null,
      timeZone: deviceTimeZone(),
    },
    {
      existingIds,
      sourcePriority: sourcePriority(sources, draft.sourceId),
      asOf: now.toISOString(),
      timeZone: deviceTimeZone(),
    },
  );
  if (result.status === 'duplicate' || !result.notification || !result.event) return null;
  existingIds.add(result.notification.id);
  return { notification: result.notification, event: result.event };
}

export function buildSeed(now: Date, sources: SourceConfig[]): { notifications: NudgeNotification[]; activity: ActivityEvent[] } {
  const existingIds = new Set<string>();
  const notifications: NudgeNotification[] = [];
  const activity: ActivityEvent[] = [];

  for (const draft of SEED_DRAFTS) {
    if (!sourceEnabled(sources, draft.sourceId)) continue;
    const created = materialize(
      {
        ...draft,
        receivedAt: new Date(now.getTime() - draft.minutesAgo * 60_000).toISOString(),
      },
      now,
      sources,
      existingIds,
    );
    if (!created) continue;
    notifications.push(created.notification);
    activity.push(created.event);
  }

  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return { notifications, activity };
}

export function createSimulation(
  kind: SimulationKind,
  now: Date,
  sources: SourceConfig[],
  existingIds: Set<string>,
): { ok: true; notification: NudgeNotification; event: ActivityEvent } | { ok: false; message: string } {
  const enabled = sources.filter((source) => source.enabled).map((source) => source.id);
  if (enabled.length === 0) {
    return { ok: false, message: 'Turn a demo source on before adding a sample.' };
  }

  let template: SimTemplate;
  if (kind === 'security') {
    if (!enabled.includes('banking')) {
      return { ok: false, message: 'The fictional bank source is off, so a new security sample was not added.' };
    }
    template = {
      sourceId: 'banking',
      sender: 'Harbor Mutual',
      title: 'New sign-in blocked',
      body: 'A new sign-in was blocked on an unfamiliar device. This fictional alert has no code or account number.',
    };
  } else if (kind === 'due_soon') {
    const sourceId = (['slack', 'whatsapp', 'gmail', 'outlook'] as SourceId[]).find((id) => enabled.includes(id));
    if (!sourceId) {
      return { ok: false, message: 'Turn on Slack, WhatsApp, Gmail, or Outlook to add a short-deadline sample.' };
    }
    template = {
      sourceId,
      sender: 'Priya Shah',
      title: 'Needed before the call',
      body: 'Can you confirm the numbers before the call? It starts in two minutes.',
      deadline: (value) => addMinutes(value, 2),
    };
  } else if (kind === 'low') {
    const sourceId = enabled.includes('gmail') ? 'gmail' : enabled[0];
    template = {
      sourceId,
      sender: 'Field & Co.',
      title: 'Sunday offer',
      body: 'Enjoy 15% off a second pair this Sunday. This is a promotion.',
    };
  } else {
    const pool = RANDOM_TEMPLATES.filter((item) => enabled.includes(item.sourceId));
    const choice = pool[existingIds.size % Math.max(pool.length, 1)] ?? RANDOM_TEMPLATES.find((item) => enabled.includes(item.sourceId));
    if (!choice) return { ok: false, message: 'Turn a demo source on before adding a sample.' };
    template = choice;
  }

  const id = `sim:${kind}:${now.getTime()}:${Math.random().toString(36).slice(2, 8)}`;
  const created = materialize(
    {
      id,
      sourceId: template.sourceId,
      sender: template.sender,
      title: template.title,
      body: template.body,
      receivedAt: now.toISOString(),
      deadline: template.deadline,
    },
    now,
    sources,
    existingIds,
  );
  if (!created) return { ok: false, message: 'That sample was already processed.' };
  return { ok: true, notification: created.notification, event: created.event };
}

export const SEED_COUNT = SEED_DRAFTS.length;
