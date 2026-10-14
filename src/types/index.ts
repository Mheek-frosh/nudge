export const SOURCE_IDS = [
  'whatsapp',
  'gmail',
  'outlook',
  'telegram',
  'slack',
  'banking',
] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

export type Category = 'security_alert' | 'deadline' | 'reply_needed' | 'general_update';

export type Priority = 'urgent' | 'high' | 'normal' | 'low';

export type NotificationStatus = 'pending' | 'snoozed' | 'handled' | 'dismissed';

export type FeedFilter = 'all' | 'urgent' | 'reply' | 'deadlines';

export type ActivityType = 'received' | 'snoozed' | 'handled' | 'reopened' | 'reminder_due';

export type SourcePriority = 'low' | 'default' | 'high';

export type SimulationKind = 'random' | 'security' | 'due_soon' | 'low';

export const SCHEMA_VERSION = 1;

export interface AnalysisInput {
  sourceId: SourceId;
  sender: string;
  title: string;
  body: string;
  receivedAt: string;
  /** Instant used for deadline proximity. Defaults to receivedAt. */
  asOf?: string;
  /** Only an explicit timestamp may become a deadline. Vague wording stays unknown. */
  explicitDeadline?: string | null;
}

export interface AnalysisResult {
  category: Category;
  priority: Priority;
  summary: string;
  reason: string;
  suggestedAction: string;
  deadlineAt: string | null;
  confidence: number;
}

export interface NotificationAnalyzer {
  analyze(input: AnalysisInput): AnalysisResult;
}

export interface NudgeNotification {
  id: string;
  sourceId: SourceId;
  sender: string;
  title: string;
  originalText: string;
  summary: string;
  category: Category;
  basePriority: Priority;
  priority: Priority;
  receivedAt: string;
  deadlineAt: string | null;
  timeZone: string | null;
  analysisReason: string;
  suggestedAction: string;
  confidence: number;
  status: NotificationStatus;
  snoozeUntil: string | null;
  handledAt: string | null;
  deadlineReminderFiredAt: string | null;
  isDemo: true;
}

export interface ActivityEvent {
  id: string;
  notificationId: string;
  type: ActivityType;
  at: string;
  title: string;
  detail?: string;
}

export interface SourceConfig {
  id: SourceId;
  enabled: boolean;
  priority: SourcePriority;
}

export interface Settings {
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  securityBypassesQuietHours: boolean;
  defaultSnoozeMinutes: 15 | 60;
  pauseReminders: boolean;
  hidePreviews: boolean;
  showBubble: boolean;
  reducedMotion: boolean;
  deviceRemindersEnabled: boolean;
  deviceReminderNote: string | null;
  onboardingComplete: boolean;
  bubbleAnchor: 'left' | 'right';
  bubbleY: number | null;
}

export interface PersistedState {
  schemaVersion: number;
  notifications: NudgeNotification[];
  activity: ActivityEvent[];
  sources: SourceConfig[];
  settings: Settings;
}

export interface IncomingNotification {
  id: string;
  sourceId: SourceId;
  sender: string;
  title: string;
  body: string;
  receivedAt: string;
  explicitDeadline?: string | null;
  timeZone?: string | null;
}

export interface IngestContext {
  existingIds: ReadonlySet<string>;
  sourcePriority: SourcePriority;
  asOf: string;
  timeZone: string | null;
}

export interface IngestResult {
  status: 'created' | 'duplicate';
  notification?: NudgeNotification;
  event?: ActivityEvent;
}

export interface NotificationIngestion {
  ingest(input: IncomingNotification, context: IngestContext): IngestResult;
}

export interface ReminderPlanItem {
  identifier: string;
  fireAt: string;
  title: string;
  body: string;
  notificationId: string;
}

export interface ReminderPlan {
  enabled: boolean;
  hidePreviews: boolean;
  items: ReminderPlanItem[];
}

export interface ReminderSyncResult {
  ok: boolean;
  message: string | null;
}

export interface ReminderScheduling {
  requestPermission(): Promise<{ granted: boolean; message: string | null }>;
  sync(plan: ReminderPlan): Promise<ReminderSyncResult>;
  cancelAll(): Promise<void>;
}

export type SourceOpenResult =
  | { status: 'opened'; message: string }
  | { status: 'unavailable'; message: string }
  | { status: 'fictional'; message: string };

export interface SourceOpening {
  openApp(sourceId: SourceId): Promise<SourceOpenResult>;
  openWebsite(sourceId: SourceId): Promise<SourceOpenResult>;
}

export interface Persistence {
  load(): Promise<PersistedState | null>;
  save(state: PersistedState): Promise<void>;
  clear(): Promise<void>;
}
