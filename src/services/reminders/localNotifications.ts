import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { NudgeNotification, ReminderPlan, ReminderScheduling, ReminderSyncResult, Settings } from '../../types';

let configured = false;

function configureHandler() {
  if (configured) return;
  configured = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    configured = false;
  }
}

export function buildReminderPlan(settings: Settings, notifications: NudgeNotification[], now = Date.now()): ReminderPlan {
  if (!settings.deviceRemindersEnabled || settings.pauseReminders) {
    return { enabled: false, hidePreviews: settings.hidePreviews, items: [] };
  }
  const items = notifications.flatMap((notification) => {
    const planned: ReminderPlan['items'] = [];
    if (notification.status === 'snoozed' && notification.snoozeUntil) {
      const fireAt = new Date(notification.snoozeUntil).getTime();
      if (fireAt > now + 1000) {
        planned.push({
          identifier: `nudge-snooze-${notification.id}`,
          fireAt: new Date(fireAt).toISOString(),
          title: settings.hidePreviews ? 'Nudge' : notification.title,
          body: settings.hidePreviews ? 'A reminder is ready in Nudge.' : notification.summary,
          notificationId: notification.id,
        });
      }
    }
    if (notification.status === 'pending' && notification.deadlineAt && !notification.deadlineReminderFiredAt) {
      const fireAt = new Date(notification.deadlineAt).getTime();
      if (fireAt > now + 1000 && fireAt < now + 24 * 60 * 60 * 1000) {
        planned.push({
          identifier: `nudge-deadline-${notification.id}`,
          fireAt: new Date(fireAt).toISOString(),
          title: settings.hidePreviews ? 'Nudge' : notification.title,
          body: settings.hidePreviews ? 'A deadline is ready in Nudge.' : 'A deadline in Nudge is due.',
          notificationId: notification.id,
        });
      }
    }
    return planned;
  });
  return { enabled: true, hidePreviews: settings.hidePreviews, items: items.slice(0, 24) };
}

export const localReminderScheduler: ReminderScheduling = {
  async requestPermission() {
    if (Platform.OS === 'web') {
      return { granted: false, message: 'Device reminders are unavailable on web. In-app reminders still work.' };
    }
    try {
      configureHandler();
      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== 'granted') {
        return {
          granted: false,
          message: 'Notifications are off for Expo Go. Snoozes still return when you open Nudge.',
        };
      }
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('nudge-reminders', {
          name: 'Nudge reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      return { granted: true, message: null };
    } catch {
      return {
        granted: false,
        message: 'This Expo Go session cannot schedule device reminders. In-app reminders still work.',
      };
    }
  },

  async cancelAll() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(
        scheduled
          .filter((item) => item.identifier.startsWith('nudge-'))
          .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
      );
    } catch {
      // In-app reminders remain the source of truth.
    }
  },

  async sync(plan): Promise<ReminderSyncResult> {
    try {
      await this.cancelAll();
      if (!plan.enabled) return { ok: true, message: null };
      configureHandler();
      for (const item of plan.items) {
        await Notifications.scheduleNotificationAsync({
          identifier: item.identifier,
          content: {
            title: item.title,
            body: item.body,
            data: { notificationId: item.notificationId },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(item.fireAt),
          },
        });
      }
      return { ok: true, message: null };
    } catch {
      return {
        ok: false,
        message: 'Device reminders could not be scheduled. Nudge will still catch up when you open the app.',
      };
    }
  },
};
