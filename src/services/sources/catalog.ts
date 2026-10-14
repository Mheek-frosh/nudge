import type { SourceConfig, SourceId, SourcePriority } from '../../types';
import { SOURCE_IDS } from '../../types';

export interface SourceMeta {
  id: SourceId;
  name: string;
  icon: 'logo-whatsapp' | 'mail-outline' | 'briefcase-outline' | 'paper-plane-outline' | 'logo-slack' | 'shield-checkmark-outline';
  tint: string;
  explanation: string;
}

export const SOURCE_META: Record<SourceId, SourceMeta> = {
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'logo-whatsapp',
    tint: '#9BBF8A',
    explanation: 'Sample chats. Nudge cannot read your WhatsApp messages.',
  },
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    icon: 'mail-outline',
    tint: '#E0B4A4',
    explanation: 'Sample email. This build does not connect to Google.',
  },
  outlook: {
    id: 'outlook',
    name: 'Outlook',
    icon: 'briefcase-outline',
    tint: '#9BB4D6',
    explanation: 'Sample mail and approvals. This build does not connect to Microsoft.',
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    icon: 'paper-plane-outline',
    tint: '#8FB8D6',
    explanation: 'Sample chats. Nudge cannot read Telegram.',
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    icon: 'logo-slack',
    tint: '#D6C4A4',
    explanation: 'Sample workspace messages. This build does not connect to Slack.',
  },
  banking: {
    id: 'banking',
    name: 'Banking',
    icon: 'shield-checkmark-outline',
    tint: '#E07A6A',
    explanation: 'Fictional alerts from Harbor Mutual. There is no bank connection.',
  },
};

export const CAPABILITIES = [
  {
    title: 'This iPhone demo',
    body: 'Nudge runs in Expo Go with sample messages only. It cannot read notifications from other apps, and the bubble stays inside Nudge. Choosing a source only turns those samples on or off.',
  },
  {
    title: 'Future Android access',
    body: 'A later Android development build could ask for notification access and draw over other apps. That needs custom native code, and it is not part of this Expo Go prototype.',
  },
  {
    title: 'Future direct integrations',
    body: 'Supported services such as Gmail or Outlook would use their own sign-in, behind a replaceable adapter. This build does not contact those services.',
  },
] as const;

export function defaultSources(enabled: SourceId[] | 'all' = 'all'): SourceConfig[] {
  return SOURCE_IDS.map((id) => ({
    id,
    enabled: enabled === 'all' ? true : enabled.includes(id),
    priority: 'default' as SourcePriority,
  }));
}

export function normalizeSources(saved: SourceConfig[] | undefined): SourceConfig[] {
  return SOURCE_IDS.map((id) => {
    const match = saved?.find((source) => source.id === id);
    const priority = match?.priority === 'low' || match?.priority === 'high' ? match.priority : 'default';
    return { id, enabled: match?.enabled ?? true, priority };
  });
}
