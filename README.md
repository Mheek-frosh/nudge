# Nudge

Important messages, kept in sight.

Nudge is a demo attention assistant. It shows a focused feed of sample messages, a draggable in-app bubble, and local reminders. This repository is an Expo Go prototype. It does not connect to WhatsApp, Gmail, Outlook, Telegram, Slack, or a bank.

## Run it on an iPhone

Use the Expo Go app from the Apple App Store. This project uses **Expo SDK 57**, which matches the current iPhone Expo Go app.

1. Install dependencies:

```bash
npm install
```

2. Start the dev server on the same Wi-Fi as your phone:

```bash
npx expo start
```

3. Open Expo Go and scan the QR code from the terminal.

If the phone cannot reach your computer, stop the server and try:

```bash
npx expo start --tunnel
```

Tunnel mode needs network access and can be slower. If Expo Go asks you to sign in, a free Expo account is enough. This project does not use a paid Apple Developer account, EAS, or a custom native build.

## Demo mode

A discreet Demo mode label stays on the main screen. The Sources screen explains the limits in the product.

- Messages come from a local demo provider, not from other apps.
- Choosing WhatsApp, Gmail, or Banking only enables fictional samples.
- The floating bubble is drawn inside Nudge. It cannot appear over other iPhone apps.
- “Open source” checks whether a link can open. In Expo Go it usually cannot, and Nudge says so. Opening or dismissing a message never marks it handled.
- Harbor Mutual is fictional. It has no app, account numbers, or codes.
- Analysis is a deterministic on-device classifier named `NotificationAnalyzer`. It is not a remote model, and the app embeds no API keys.
- Deadlines are stored only when a sample includes an explicit time. Vague wording stays unknown.
- Snoozed items return when you reopen the app, including after a restart. Quiet hours can defer ordinary reminders, including an overnight range. Security samples can be allowed through quiet hours. Pausing reminders holds everything.
- Optional device reminders use local notifications and ask for permission only after you enable them in Settings. If permission is denied or unavailable, the in-app feed still works. Remote push is not used.

## Scripts

```bash
npm test
npm run typecheck
npx expo start
```

## Project shape

`app/` holds the Expo Router screens. Feature UI lives in `src/features`, and replaceable adapters live in `src/services`:

- notification ingestion
- `NotificationAnalyzer`
- reminder scheduling
- source opening
- persistence, with schema version 1 in AsyncStorage

Demo adapters implement those interfaces today. A later Gmail or Outlook integration, an Android notification listener, or a server model can replace an adapter without rebuilding the screens.

## Toward a real product

**Android development build.** iOS does not let one app read another app’s notifications. Android can, with a custom development build and a notification listener plus a system overlay. That is native code, so it cannot ship inside Expo Go. The UI can keep using the same ingestion interface and swap the demo provider for a listener.

**Email and chat integrations.** Supported services would use their own sign-in and official APIs, ideally through a backend that stores tokens. The mobile client should keep receiving normalized notifications and should not embed provider secrets. Gmail and Microsoft Graph are the realistic path for mail. WhatsApp, Telegram, and Slack would depend on those companies’ APIs and policies. Banking alerts should come from a real institution’s API, never from a scraped notification.

**Reminders.** In-app reconciliation stays the source of truth. A development build can add reliable local notifications, and a later backend can add remote push for users who opt in.
