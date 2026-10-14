import { create } from 'zustand';
import type { ActivityEvent, ActivityType, NudgeNotification, Settings, SimulationKind, SourceId, SourcePriority } from '../types';
import { SCHEMA_VERSION } from '../types';
import { persistence } from '../services/persistence/storage';
import { buildSeed, createSimulation } from '../services/notifications/samples';
import { applySourcePriority } from '../services/notifications/priority';
import { reconcileReminders } from '../services/reminders/engine';
import { buildReminderPlan, localReminderScheduler } from '../services/reminders/localNotifications';
import { defaultSources, normalizeSources } from '../services/sources/catalog';
import { formatTime } from '../utils/time';

export interface OnboardingInput {
  enabledSourceIds: SourceId[];
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  securityBypassesQuietHours: boolean;
  defaultSnoozeMinutes: 15 | 60;
}

export const defaultSettings: Settings = {
  quietHoursEnabled: true,
  quietStart: '22:00',
  quietEnd: '07:00',
  securityBypassesQuietHours: true,
  defaultSnoozeMinutes: 15,
  pauseReminders: false,
  hidePreviews: false,
  showBubble: true,
  reducedMotion: false,
  deviceRemindersEnabled: false,
  deviceReminderNote: null,
  onboardingComplete: false,
  bubbleAnchor: 'right',
  bubbleY: null,
};

interface AppState {
  hydrated: boolean;
  notifications: NudgeNotification[];
  activity: ActivityEvent[];
  sources: ReturnType<typeof defaultSources>;
  settings: Settings;
  bubbleOpen: boolean;
  pulse: number;
  now: number;
  hydrate: () => Promise<void>;
  completeOnboarding: (input: OnboardingInput) => void;
  markHandled: (id: string) => void;
  snooze: (id: string, untilIso: string) => boolean;
  reopen: (id: string) => void;
  toggleSource: (id: SourceId, enabled: boolean) => void;
  setSourcePriority: (id: SourceId, priority: SourcePriority) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setBubblePlacement: (anchor: 'left' | 'right', y: number) => void;
  setBubbleAnchor: (anchor: 'left' | 'right') => void;
  setBubbleOpen: (open: boolean) => void;
  resetDemo: () => void;
  replayOnboarding: () => void;
  simulate: (kind: SimulationKind) => string | null;
  reconcile: () => void;
  enableDeviceReminders: () => Promise<string | null>;
  disableDeviceReminders: () => Promise<void>;
}

let activitySeq = 0;

function createActivityId(prefix: string): string {
  activitySeq += 1;
  return `act:${prefix}:${Date.now().toString(36)}:${activitySeq}`;
}

function makeEvent(type: ActivityType, notification: NudgeNotification, at: Date, detail: string): ActivityEvent {
  return {
    id: createActivityId(type),
    notificationId: notification.id,
    type,
    at: at.toISOString(),
    title: notification.title,
    detail,
  };
}

type Snapshot = Pick<AppState, 'notifications' | 'activity' | 'sources' | 'settings'>;

function toPersisted(state: Snapshot) {
  return {
    schemaVersion: SCHEMA_VERSION,
    notifications: state.notifications,
    activity: state.activity.slice(0, 400),
    sources: state.sources,
    settings: state.settings,
  };
}

function urgentArrived(previous: NudgeNotification[], next: NudgeNotification[]): boolean {
  return next.some((item) => {
    if (item.status !== 'pending' || item.priority !== 'urgent') return false;
    const prior = previous.find((candidate) => candidate.id === item.id);
    if (!prior) return true;
    return prior.status !== 'pending' || prior.priority !== 'urgent';
  });
}

async function syncReminders(state: Snapshot) {
  const plan = buildReminderPlan(state.settings, state.notifications);
  const result = await localReminderScheduler.sync(plan);
  const current = useAppStore.getState();
  if (result.ok && current.settings.deviceReminderNote && current.settings.deviceRemindersEnabled) {
    const settings = { ...current.settings, deviceReminderNote: null };
    useAppStore.setState({ settings });
    await persistence.save(toPersisted({ ...current, settings }));
    return;
  }
  if (!result.ok && result.message && current.settings.deviceReminderNote !== result.message) {
    const settings = { ...current.settings, deviceReminderNote: result.message };
    useAppStore.setState({ settings });
    await persistence.save(toPersisted({ ...current, settings }));
  }
}

function commit(partial: Partial<AppState>, options?: { sync?: boolean }) {
  useAppStore.setState(partial);
  const next = useAppStore.getState();
  const snapshot: Snapshot = {
    notifications: next.notifications,
    activity: next.activity.slice(0, 400),
    sources: next.sources,
    settings: next.settings,
  };
  void persistence.save(toPersisted(snapshot));
  if (options?.sync !== false) void syncReminders(snapshot);
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  notifications: [],
  activity: [],
  sources: defaultSources(),
  settings: { ...defaultSettings },
  bubbleOpen: false,
  pulse: 0,
  now: Date.now(),

  hydrate: async () => {
    if (get().hydrated) return;
    const saved = await persistence.load();
    const now = new Date();
    if (!saved) {
      set({ hydrated: true, now: now.getTime() });
      return;
    }
    const settings = { ...defaultSettings, ...saved.settings };
    const sources = normalizeSources(saved.sources);
    const reconciled = reconcileReminders(saved.notifications, now, settings, () => createActivityId('hydrate'));
    const activity = [...reconciled.events, ...saved.activity].slice(0, 400);
    const pulse = urgentArrived(saved.notifications, reconciled.notifications) ? 1 : 0;
    set({
      hydrated: true,
      notifications: reconciled.notifications,
      activity,
      sources,
      settings,
      now: now.getTime(),
      pulse,
    });
    if (reconciled.events.length > 0 || settings.deviceRemindersEnabled) {
      void persistence.save(toPersisted({ notifications: reconciled.notifications, activity, sources, settings }));
      void syncReminders({ notifications: reconciled.notifications, activity, sources, settings });
    }
  },

  completeOnboarding: (input) => {
    const now = new Date();
    const sources = defaultSources(input.enabledSourceIds);
    const seeded = buildSeed(now, sources);
    const settings: Settings = {
      ...get().settings,
      quietHoursEnabled: input.quietHoursEnabled,
      quietStart: input.quietStart,
      quietEnd: input.quietEnd,
      securityBypassesQuietHours: input.securityBypassesQuietHours,
      defaultSnoozeMinutes: input.defaultSnoozeMinutes,
      onboardingComplete: true,
    };
    commit({
      notifications: seeded.notifications,
      activity: seeded.activity,
      sources,
      settings,
      now: now.getTime(),
      bubbleOpen: false,
      pulse: seeded.notifications.some((item) => item.priority === 'urgent') ? get().pulse + 1 : get().pulse,
    });
  },

  markHandled: (id) => {
    const current = get().notifications.find((item) => item.id === id);
    if (!current || current.status === 'handled') return;
    const now = new Date();
    const notifications = get().notifications.map((item) =>
      item.id === id ? { ...item, status: 'handled' as const, handledAt: now.toISOString(), snoozeUntil: null } : item,
    );
    commit({
      notifications,
      activity: [makeEvent('handled', current, now, 'Marked handled'), ...get().activity],
      now: now.getTime(),
    });
  },

  snooze: (id, untilIso) => {
    const until = new Date(untilIso).getTime();
    if (Number.isNaN(until) || until <= Date.now()) return false;
    const current = get().notifications.find((item) => item.id === id);
    if (!current || current.status === 'handled') return false;
    const now = new Date();
    const notifications = get().notifications.map((item) =>
      item.id === id ? { ...item, status: 'snoozed' as const, snoozeUntil: new Date(until).toISOString() } : item,
    );
    commit({
      notifications,
      activity: [makeEvent('snoozed', current, now, `Until ${formatTime(new Date(until).toISOString())}`), ...get().activity],
      now: now.getTime(),
    });
    return true;
  },

  reopen: (id) => {
    const current = get().notifications.find((item) => item.id === id);
    if (!current || current.status === 'pending') return;
    const now = new Date();
    const notifications = get().notifications.map((item) =>
      item.id === id ? { ...item, status: 'pending' as const, handledAt: null, snoozeUntil: null } : item,
    );
    const detail = current.status === 'snoozed' ? 'Returned before the snooze ended' : 'Reopened';
    commit({
      notifications,
      activity: [makeEvent('reopened', current, now, detail), ...get().activity],
      now: now.getTime(),
    });
  },

  toggleSource: (id, enabled) => {
    commit({
      sources: get().sources.map((source) => (source.id === id ? { ...source, enabled } : source)),
    });
  },

  setSourcePriority: (id, priority) => {
    const sources = get().sources.map((source) => (source.id === id ? { ...source, priority } : source));
    const notifications = get().notifications.map((item) =>
      item.sourceId === id ? { ...item, priority: applySourcePriority(item.basePriority, priority, item.category) } : item,
    );
    commit({ sources, notifications });
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    const now = new Date();
    const reconciled = reconcileReminders(get().notifications, now, settings, () => createActivityId('settings'));
    const pulse = urgentArrived(get().notifications, reconciled.notifications) ? get().pulse + 1 : get().pulse;
    commit({
      settings,
      notifications: reconciled.notifications,
      activity: [...reconciled.events, ...get().activity],
      now: now.getTime(),
      pulse,
    });
  },

  setBubblePlacement: (anchor, y) => {
    commit({ settings: { ...get().settings, bubbleAnchor: anchor, bubbleY: y } }, { sync: false });
  },

  setBubbleAnchor: (anchor) => {
    commit({ settings: { ...get().settings, bubbleAnchor: anchor } }, { sync: false });
  },

  setBubbleOpen: (open) => set({ bubbleOpen: open }),

  resetDemo: () => {
    const now = new Date();
    const settings = { ...get().settings, pauseReminders: false };
    const seeded = buildSeed(now, get().sources);
    commit({
      notifications: seeded.notifications,
      activity: seeded.activity,
      settings,
      now: now.getTime(),
      bubbleOpen: false,
      pulse: 0,
    });
  },

  replayOnboarding: () => {
    commit({ settings: { ...get().settings, onboardingComplete: false } }, { sync: false });
  },

  simulate: (kind) => {
    const now = new Date();
    const existing = new Set(get().notifications.map((item) => item.id));
    const result = createSimulation(kind, now, get().sources, existing);
    if (!result.ok) return result.message;
    const notifications = [result.notification, ...get().notifications];
    const pulse = result.notification.priority === 'urgent' ? get().pulse + 1 : get().pulse;
    commit({
      notifications,
      activity: [result.event, ...get().activity],
      now: now.getTime(),
      pulse,
    });
    return null;
  },

  reconcile: () => {
    const now = new Date();
    const previous = get().notifications;
    const reconciled = reconcileReminders(previous, now, get().settings, () => createActivityId('tick'));
    const changed = reconciled.events.length > 0 || reconciled.notifications.some((item, index) => item !== previous[index]);
    if (!changed) {
      set({ now: now.getTime() });
      return;
    }
    const pulse = urgentArrived(previous, reconciled.notifications) ? get().pulse + 1 : get().pulse;
    commit({
      notifications: reconciled.notifications,
      activity: [...reconciled.events, ...get().activity],
      now: now.getTime(),
      pulse,
    });
  },

  enableDeviceReminders: async () => {
    const permission = await localReminderScheduler.requestPermission();
    if (!permission.granted) {
      commit({
        settings: {
          ...get().settings,
          deviceRemindersEnabled: false,
          deviceReminderNote: permission.message,
        },
      });
      return permission.message;
    }
    commit({
      settings: { ...get().settings, deviceRemindersEnabled: true, deviceReminderNote: null },
    });
    return null;
  },

  disableDeviceReminders: async () => {
    commit({
      settings: { ...get().settings, deviceRemindersEnabled: false, deviceReminderNote: null },
    });
    await localReminderScheduler.cancelAll();
  },
}));
