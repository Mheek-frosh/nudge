import { Linking } from 'react-native';
import type { SourceId, SourceOpenResult, SourceOpening } from '../../types';

const APP_URLS: Record<Exclude<SourceId, 'banking'>, string> = {
  whatsapp: 'whatsapp://',
  gmail: 'googlegmail://',
  outlook: 'ms-outlook://',
  telegram: 'tg://',
  slack: 'slack://',
};

const WEB_URLS: Record<Exclude<SourceId, 'banking'>, string> = {
  whatsapp: 'https://www.whatsapp.com',
  gmail: 'https://mail.google.com',
  outlook: 'https://outlook.office.com',
  telegram: 'https://web.telegram.org',
  slack: 'https://slack.com',
};

const FICTIONAL: SourceOpenResult = {
  status: 'fictional',
  message: 'Harbor Mutual is a fictional bank in this demo. There is no app or website to open, and this item stays unhandled.',
};

async function tryOpen(url: string, success: string, failure: string): Promise<SourceOpenResult> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) return { status: 'unavailable', message: failure };
    await Linking.openURL(url);
    return { status: 'opened', message: success };
  } catch {
    return { status: 'unavailable', message: failure };
  }
}

export const sourceOpener: SourceOpening = {
  async openApp(sourceId) {
    if (sourceId === 'banking') return FICTIONAL;
    return tryOpen(
      APP_URLS[sourceId],
      'The source app opened. This item was not marked handled.',
      'Nudge could not open that app. Expo Go on iPhone cannot launch other apps from here. Nothing was marked handled.',
    );
  },
  async openWebsite(sourceId) {
    if (sourceId === 'banking') return FICTIONAL;
    return tryOpen(
      WEB_URLS[sourceId],
      'Opened the public website. This is not the specific message, and nothing was marked handled.',
      'The public website could not be opened. Nothing was marked handled.',
    );
  },
};
