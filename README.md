# Baby Log

A shared newborn tracker for feeds, diapers, sleep and appointments. It installs on a phone's home screen like a native app, and two parents can log to the same family log in real time.

I built it during my maternity leave because I needed it myself. It's a small product case study as much as a code project: one real user, a real constraint (tired parents, one hand free, often no signal), and a few deliberate tradeoffs.

## The problem
In the first weeks, both parents need to answer the same questions at 3 a.m.: *When was the last feed? Which side? Did anyone change a diaper? When is the next check-up?* Texting each other or using a notes app breaks down fast, and many tracker apps are ad-heavy, locked behind subscriptions, or can't be shared easily.

## What it does
- **One-tap logging** for feeds (left, right, bottle with amount), diapers (wet, dirty, both), sleep, pumping, medication and notes
- **Timers** for breast feeds and sleep, with manual entry as a fallback
- **"Time since last feed"** as the largest thing on the screen, plus today's totals
- **Appointments** for baby and parent, with notes, mark-as-done, and "Add to calendar" (with a reminder)
- **Shared family log:** each parent has their own login; one creates the family and shares an 8-character invite code, and everyone who joins sees the same data, live
- **Baby photo** on the home screen
- **Works offline** and syncs when the connection returns
- **Export:** CSV and JSON backup

## Product decisions
| Decision | Why |
|---|---|
| Installable web app (PWA), not a native app | Works on iPhone and Android, no App Store fees or review, updates ship instantly |
| Shared family log with invite code, not separate accounts | The real job is co-parenting; separate accounts would defeat it |
| Invite code instead of email invitations | Faster to share by text, no email infrastructure to build |
| Offline-first | Night feeds happen in bad Wi-Fi corners; logging must never fail |
| Local-only mode when no backend is configured | Anyone can try it with zero setup; the cloud features are opt-in |
| Big tap targets, minimal typing | Designed for one-handed use while holding a baby |
| Data export | Parents own their data and can leave at any time |

## Tech
- Plain HTML, CSS and JavaScript (no framework or build step)
- Firebase Authentication (email and password) and Cloud Firestore for accounts and shared data
- Firestore security rules so only family members can read or write a family's data (`firestore.rules`)
- Service worker for offline use and installability

## Try it
**Single phone, no setup:** open `index.html` through any static server (for example `python3 -m http.server`) and use it as-is.

**With logins and sharing:** follow [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md), paste your Firebase config into `firebase-config.js`, and host the folder anywhere that serves static files (Netlify, GitHub Pages, etc.).

## Privacy
Data is stored in the Firebase project of whoever deploys the app. With the included rules, only signed-in members of a family can read that family's data, and invite codes can only be looked up by exact match.

## What I'd do next
- Growth chart and weight tracking
- Vaccination schedule with reminders
- Pattern insights (average gap between feeds, longest sleep stretch)
- Push notifications for upcoming appointments
- Remove-member and leave-family controls
- Shared running timers across both phones

## How it was built
I designed the product and made the decisions above, and built it with Claude Code as my pair-programmer. Setting up Firebase, writing the security rules and deploying were part of the work too.
