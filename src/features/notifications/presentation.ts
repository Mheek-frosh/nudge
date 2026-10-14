import type { Category, Priority } from '../../types';

export function categoryLabel(category: Category): string {
  switch (category) {
    case 'security_alert':
      return 'Security';
    case 'deadline':
      return 'Deadline';
    case 'reply_needed':
      return 'Reply';
    case 'general_update':
      return 'Update';
  }
}

export function categoryTone(category: Category): 'coral' | 'amber' | 'lime' | 'muted' {
  switch (category) {
    case 'security_alert':
      return 'coral';
    case 'deadline':
      return 'amber';
    case 'reply_needed':
      return 'lime';
    case 'general_update':
      return 'muted';
  }
}

export function priorityLabel(priority: Priority): string {
  switch (priority) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'High';
    case 'normal':
      return 'Normal';
    case 'low':
      return 'Low';
  }
}

export function previewText(summary: string, hidePreviews: boolean): string {
  return hidePreviews ? 'Preview hidden' : summary;
}
