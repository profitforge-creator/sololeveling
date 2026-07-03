# Gatebound System

A private, single-player real-life RPG built as an installable PWA. The app is intentionally optimized for one local profile, one phone push subscription, one schedule, and one long-form Hunter campaign.

## Local development

```bash
npm install
npm run dev
npm run build
npm run preview
```

There is currently no lint or automated-test script in this repository.

## Install on iPhone

1. Open the production URL in Safari.
2. Tap Share.
3. Tap **Add to Home Screen**.
4. Confirm the Gatebound name and icon.
5. Open Gatebound from the new Home Screen icon.
6. In Settings, enter the private link key and tap **Enable Notifications**.

iPhone Web Push requires iOS/iPadOS 16.4 or newer and the installed Home Screen PWA. A normal Safari tab cannot request iPhone PWA push permission.

## Private push setup

The frontend, service worker, subscription endpoint, test endpoint, and private scheduler are implemented. Configure these Vercel environment variables:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_WEB_PUSH_PUBLIC_KEY` | Build/client | Public VAPID key used by the browser subscription |
| `VAPID_PUBLIC_KEY` | Server | Same public VAPID key |
| `VAPID_PRIVATE_KEY` | Server secret | Signs push messages; never expose it to Vite |
| `VAPID_SUBJECT` | Server | Usually `mailto:you@example.com` |
| `PRIVATE_API_TOKEN` | Server secret | Private link key pasted into the app on your phone |
| `CRON_SECRET` | Server secret | Protects the Vercel Cron endpoint |
| `BLOB_READ_WRITE_TOKEN` | Server secret | Added automatically by a connected private Vercel Blob store |

The preferred store is a private Vercel Blob store. As an optional fallback, `KV_REST_API_URL` / `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are also recognized. The app stores only one private notification profile.

Generate VAPID keys once:

```bash
npx web-push generate-vapid-keys
```

Use the same public key for both public-key variables. Put only the server values in Vercel; the private link key is pasted into Settings on the one authorized phone and stored locally on that device.

### Endpoints

- `POST /api/notifications/subscribe` — replaces the one private subscription and synchronizes its schedule.
- `POST /api/notifications/test` — sends “System connection confirmed.” to that subscription.
- `GET /api/cron/send-notifications` — checks the private schedule and sends due alerts.

The first two require `Authorization: Bearer <PRIVATE_API_TOKEN>`. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` to its cron invocation.

## Scheduler limitation

`vercel.json` creates one once-daily job for every UTC hour so a Vercel Hobby deployment can check the schedule roughly hourly while remaining within the once-per-day-per-job restriction. Hobby cron timing is imprecise (up to approximately one hour late), so the displayed reminder minute is a target, not a delivery guarantee. Vercel Pro can replace these with a single every-five-minute cron for much tighter timing.

Foreground reminders still run while the app is open. Closed-app phone delivery uses the server scheduler above.

## Save migration and safety

This release performs the requested one-time `fresh-e-rank-v1` migration. On the first load only it:

- stores a pre-reset recovery snapshot locally;
- clears active gameplay/story progress;
- creates an E-Rank, level-1, zero-XP player;
- starts Story Mode at Day 1 with no path, Shadows, guild, bosses, or advanced authority;
- records a permanent initialization marker so refreshes never repeat the wipe.

Notification settings and the private link key use separate storage keys. Settings includes Backup, Export, Import, Reset Story Only, and a dangerous Reset All flow.

## Native apps later

No Xcode, Capacitor, or App Store work is required for this build. Native iOS compilation would require a Mac/Xcode or a cloud Mac. Android packaging can be added from Windows later; the current recommended path is the installable PWA.
