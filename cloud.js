// Firebase glue: email/password login + a shared "family" log in Firestore.
// Loaded dynamically by index.html only when firebase-config.js has real values.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail}
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, writeBatch}
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid mix-ups
const genCode = () => {
  const a = new Uint32Array(8);
  crypto.getRandomValues(a);
  return [...a].map(n => ALPHABET[n % ALPHABET.length]).join('');
};
const hint = {
  get: u => { try { return localStorage.getItem('fid:' + u); } catch { return null; } },
  set: (u, v) => { try { localStorage.setItem('fid:' + u, v); } catch {} },
};

export function createCloud(cfg) {
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  // Offline cache so logging works with no signal; syncs when back online.
  const db = initializeFirestore(app, {localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})});
  let fid = null, unsubs = [], authCb = null, family = {};
  const stop = () => { unsubs.forEach(f => f()); unsubs = []; };
  const notify = () => authCb && authCb({user: auth.currentUser, familyId: fid});
  const col = sub => collection(db, 'families', fid, sub);

  return {
    get email() { return auth.currentUser?.email || ''; },
    get code() { return family.code || ''; },

    onAuth(cb) {
      authCb = cb;
      onAuthStateChanged(auth, async user => {
        stop(); fid = null; family = {};
        if (user) {
          try {
            const s = await getDoc(doc(db, 'users', user.uid));
            fid = s.exists() ? s.data().familyId : null;
            if (fid) hint.set(user.uid, fid);
          } catch (e) {
            fid = hint.get(user.uid); // offline on a fresh start: fall back to remembered family
          }
        }
        notify();
      });
    },

    signUp: (email, pw) => createUserWithEmailAndPassword(auth, email, pw),
    signIn: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
    reset: email => sendPasswordResetEmail(auth, email),
    signOut: () => { stop(); return signOut(auth); },

    async createFamily(babyName) {
      const u = auth.currentUser;
      const ref = doc(collection(db, 'families'));
      const code = genCode();
      await setDoc(ref, {ownerUid: u.uid, babyName: babyName || '', code, createdAt: Date.now()});
      await setDoc(doc(db, 'invites', code), {familyId: ref.id, createdBy: u.uid});
      await setDoc(doc(db, 'users', u.uid), {familyId: ref.id, joinCode: code, email: u.email});
      fid = ref.id; hint.set(u.uid, fid); notify();
    },

    async joinFamily(rawCode) {
      const u = auth.currentUser;
      const code = String(rawCode || '').trim().toUpperCase();
      if (!code) throw new Error('invalid-code');
      const inv = await getDoc(doc(db, 'invites', code));
      if (!inv.exists()) throw new Error('invalid-code');
      const id = inv.data().familyId;
      await setDoc(doc(db, 'users', u.uid), {familyId: id, joinCode: code, email: u.email});
      fid = id; hint.set(u.uid, fid); notify();
    },

    // Move this user into another family (via its invite code), optionally copying their existing entries over.
    async switchFamily(rawCode, bring) {
      const u = auth.currentUser;
      const code = String(rawCode || '').trim().toUpperCase();
      if (!code) throw new Error('invalid-code');
      const inv = await getDoc(doc(db, 'invites', code));
      if (!inv.exists()) throw new Error('invalid-code');
      const newId = inv.data().familyId;
      if (newId === fid) throw new Error('same-family');
      // Read the old family's data while we are still a member of it.
      let carry = [];
      if (bring && fid) {
        const [e, a] = await Promise.all([getDocs(col('entries')), getDocs(col('appts'))]);
        carry = [...e.docs.map(d => ['entries', d.data()]), ...a.docs.map(d => ['appts', d.data()])];
      }
      stop();
      await setDoc(doc(db, 'users', u.uid), {familyId: newId, joinCode: code, email: u.email});
      fid = newId; hint.set(u.uid, fid);
      for (let i = 0; i < carry.length; i += 400) {
        const b = writeBatch(db);
        carry.slice(i, i + 400).forEach(([sub, r]) => b.set(doc(db, 'families', fid, sub, r.id), r));
        await b.commit();
      }
      notify();
    },

    subscribe(h) {
      stop();
      const err = e => h.onError && h.onError(e);
      unsubs.push(onSnapshot(doc(db, 'families', fid), s => { family = s.data() || {}; h.onFamily && h.onFamily(family); }, err));
      unsubs.push(onSnapshot(col('entries'), s => h.onEntries(s.docs.map(d => d.data())), err));
      unsubs.push(onSnapshot(col('appts'), s => h.onAppts(s.docs.map(d => d.data())), err));
    },

    putEntry: r => setDoc(doc(db, 'families', fid, 'entries', r.id), r),
    delEntry: id => deleteDoc(doc(db, 'families', fid, 'entries', id)),
    putAppt: r => setDoc(doc(db, 'families', fid, 'appts', r.id), r),
    delAppt: id => deleteDoc(doc(db, 'families', fid, 'appts', id)),
    setBabyName: name => updateDoc(doc(db, 'families', fid), {babyName: name}),
    setPhoto: dataUrl => updateDoc(doc(db, 'families', fid), {photo: dataUrl}), // small (~20KB) resized JPEG
    async clearEntries() {
      const s = await getDocs(col('entries'));
      for (let i = 0; i < s.docs.length; i += 400) {
        const b = writeBatch(db);
        s.docs.slice(i, i + 400).forEach(d => b.delete(d.ref));
        await b.commit();
      }
    },
  };
}
