import type { Category, Priority, SourcePriority } from '../../types';

const ORDER: Priority[] = ['low', 'normal', 'high', 'urgent'];

export function applySourcePriority(base: Priority, source: SourcePriority, category: Category): Priority {
  if (source === 'default') return base;
  const delta = source === 'high' ? 1 : -1;
  let index = ORDER.indexOf(base) + delta;
  index = Math.max(0, Math.min(ORDER.length - 1, index));
  if (category === 'security_alert' && index < ORDER.indexOf('high')) {
    index = ORDER.indexOf('high');
  }
  return ORDER[index] ?? base;
}
