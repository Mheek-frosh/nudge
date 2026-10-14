import type { AnalysisInput, AnalysisResult, Category, NotificationAnalyzer, Priority } from '../../types';

const HOUR = 60 * 60 * 1000;

const SECURITY_PATTERNS = [
  /password reset/i,
  /unfamiliar login/i,
  /new sign-in/i,
  /sign-in was blocked/i,
  /security alert/i,
  /suspicious sign-in/i,
];

const REPLY_PATTERNS = [
  /\bcan you\b/i,
  /\bcould you\b/i,
  /\bare you free\b/i,
  /\bplease confirm\b/i,
  /\breply with\b/i,
  /\blet me know\b/i,
  /\bneed your\b/i,
  /\breview the\b/i,
];

const DEADLINE_PATTERNS = [
  /\bdue\b/i,
  /\bdeadline\b/i,
  /\bbefore\b/i,
  /\bapproval\b/i,
  /\binvoice\b/i,
  /\bon the calendar\b/i,
  /\bby end of day\b/i,
];

const PROMO_PATTERNS = [/\d+\s*%\s*off/i, /this is a promotion/i];

const CASUAL_PATTERNS = [
  /no need to reply/i,
  /nothing is blocked/i,
  /start without me/i,
  /statement is ready/i,
];

function matches(patterns: RegExp[], text: string): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function explicitDeadline(value: string | null | undefined): string | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString();
}

export function summarize(body: string): string {
  const clean = body.replace(/\s+/g, ' ').trim();
  if (clean.length <= 110) return clean;
  const sliced = clean.slice(0, 107);
  const lastSpace = sliced.lastIndexOf(' ');
  const clipped = (lastSpace > 60 ? sliced.slice(0, lastSpace) : sliced).trim();
  return `${clipped}…`;
}

function priorityFor(category: Category, deadlineAt: string | null, asOf: string, casual: boolean): Priority {
  if (category === 'security_alert') return 'urgent';
  if (casual) return 'low';
  if (category === 'general_update') return 'normal';
  if (deadlineAt) {
    const delta = new Date(deadlineAt).getTime() - new Date(asOf).getTime();
    if (!Number.isNaN(delta) && delta <= 2 * HOUR) return 'urgent';
    return 'high';
  }
  if (category === 'reply_needed') return 'high';
  return 'normal';
}

function reasonFor(
  category: Category,
  hasDeadline: boolean,
  deadlineLanguage: boolean,
  casualKind: 'promo' | 'casual' | 'none',
): string {
  if (category === 'security_alert') {
    return 'Demo analysis: the wording matches a security alert, so this stays urgent.';
  }
  if (casualKind === 'promo') {
    return 'Demo analysis: this reads as a promotion, so it stays low priority.';
  }
  if (casualKind === 'casual') {
    return 'Demo analysis: this looks like an ordinary update.';
  }
  if (category === 'reply_needed' && hasDeadline) {
    return 'Demo analysis: someone asked for a response, and a deadline was included.';
  }
  if (category === 'reply_needed' && deadlineLanguage) {
    return 'Demo analysis: someone asked for a response. The timing was too vague to set a deadline.';
  }
  if (category === 'reply_needed') {
    return 'Demo analysis: someone is waiting on a response.';
  }
  if (category === 'deadline' && hasDeadline) {
    return 'Demo analysis: a deadline was included with this sample.';
  }
  if (category === 'deadline') {
    return 'Demo analysis: it sounds time-sensitive, but no exact deadline was included.';
  }
  return 'Demo analysis: no urgent action or clear deadline was found.';
}

function actionFor(category: Category): string {
  switch (category) {
    case 'security_alert':
      return 'Review the alert where it came from. This sample contains no codes or account details.';
    case 'reply_needed':
      return 'Respond, then mark it handled in Nudge.';
    case 'deadline':
      return 'Complete the action before the deadline, then mark it handled.';
    case 'general_update':
      return 'No action is needed unless you want to read it.';
  }
}

function confidenceFor(
  category: Category,
  hasDeadline: boolean,
  casualKind: 'promo' | 'casual' | 'none',
): number {
  if (category === 'security_alert') return 0.92;
  if (casualKind === 'promo') return 0.88;
  if (casualKind === 'casual') return 0.8;
  if (category === 'reply_needed' && hasDeadline) return 0.86;
  if (category === 'reply_needed') return 0.78;
  if (category === 'deadline' && hasDeadline) return 0.84;
  if (category === 'deadline') return 0.6;
  return 0.55;
}

export const demoNotificationAnalyzer: NotificationAnalyzer = {
  analyze(input: AnalysisInput): AnalysisResult {
    const text = `${input.title}\n${input.body}`;
    const deadlineAt = explicitDeadline(input.explicitDeadline);
    const asOf = input.asOf ?? input.receivedAt;
    const deadlineLanguage = matches(DEADLINE_PATTERNS, text);
    const promo = matches(PROMO_PATTERNS, text);
    const casual = matches(CASUAL_PATTERNS, text);

    let category: Category = 'general_update';
    if (matches(SECURITY_PATTERNS, text)) category = 'security_alert';
    else if (matches(REPLY_PATTERNS, text)) category = 'reply_needed';
    else if (deadlineAt || deadlineLanguage) category = 'deadline';

    const casualKind = category === 'general_update' ? (promo ? 'promo' : casual ? 'casual' : 'none') : 'none';
    const priority = priorityFor(category, deadlineAt, asOf, casualKind !== 'none');

    return {
      category,
      priority,
      summary: summarize(input.body),
      reason: reasonFor(category, Boolean(deadlineAt), deadlineLanguage, casualKind),
      suggestedAction: actionFor(category),
      deadlineAt,
      confidence: confidenceFor(category, Boolean(deadlineAt), casualKind),
    };
  },
};
