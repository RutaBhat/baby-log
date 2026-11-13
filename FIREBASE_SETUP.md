# Turn on logins + shared family log (about 10 minutes, free)

Use a **personal** Google account for this, not a work one.

1. Go to https://console.firebase.google.com → **Add project** → name it (e.g. `baby-log`) → turn **Google Analytics off** → Create.
2. **Build → Authentication → Get started → Email/Password → Enable → Save.**
3. **Build → Firestore Database → Create database** → pick the region closest to you → **Start in production mode**.
4. Firestore → **Rules** tab → delete everything → paste the contents of `firestore.rules` → **Publish**.
5. **Project settings (gear icon) → General → Your apps → Web (`</>`)** → nickname it → Register app (skip hosting).
   Copy the `firebaseConfig` values it shows.
6. Paste those values into `firebase-config.js` (replace every `YOUR_...`).
7. Deploy the folder (e.g. drag it onto Netlify Drop). Then in Firebase: **Authentication → Settings → Authorized domains → Add domain** → add your Netlify domain (e.g. `mybabylog.netlify.app`).

## Using it
- First parent: open the app → **Create an account** → **Create family log** → Settings shows an **invite code**.
- Husband / others: install the app → **Create an account** → paste the **invite code** → **Join**.
- Everyone sees the same feeds, diapers, sleep, appointments and baby photo, updating live.
- Only people who have the invite code can join. Anyone without it sees nothing.
