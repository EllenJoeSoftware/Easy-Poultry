/**
 * Easy Poultry API client.
 *
 * Pure Firebase implementation (Auth + Firestore + Storage). No external
 * platform dependencies — this is the app's own data layer.
 *
 * Surface:
 *   api.entities.<EntityName>.list(orderBy?, limit?)
 *   api.entities.<EntityName>.filter(whereObj, orderBy?, limit?)
 *   api.entities.<EntityName>.get(id)
 *   api.entities.<EntityName>.create(data)
 *   api.entities.<EntityName>.update(id, data)
 *   api.entities.<EntityName>.delete(id)
 *
 *   api.auth.me()
 *   api.auth.logout(redirectUrl?)
 *   api.auth.updateMe(data)
 *   api.auth.redirectToLogin(returnUrl?)
 *   api.auth.signIn(email, password)
 *   api.auth.signUp(email, password, profile?)
 *   api.auth.signInWithGoogle()
 *   api.auth.onChange(cb)
 *
 *   api.integrations.Core.UploadFile({ file })
 *   api.integrations.Core.SendEmail / SendSMS / InvokeLLM / GenerateImage
 *
 *   api.functions.invoke(name, payload)
 *   api.agents.{createConversation, sendMessage, subscribeToConversation, getWhatsAppConnectURL}
 *   api.appLogs.logUserInApp(pageName)
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy as fsOrderBy,
  limit as fsLimit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset as fbConfirmPasswordReset,
  verifyPasswordResetCode as fbVerifyPasswordResetCode,
} from 'firebase/auth';
import { db, storage, auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';

const demoStore = new Map();
const ensureCollection = (n) => {
  if (!demoStore.has(n)) demoStore.set(n, new Map());
  return demoStore.get(n);
};
const newId = () => 'demo_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);

const tsToISO = (v) => {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
};

const normalizeDoc = (snap) => {
  if (!snap) return null;
  const data = snap.data();
  if (!data) return null;
  const out = { id: snap.id, ...data };
  for (const k of Object.keys(out)) if (out[k] instanceof Timestamp) out[k] = tsToISO(out[k]);
  return out;
};

const parseOrderBy = (s) => {
  if (!s) return null;
  const desc = s.startsWith('-');
  return { field: desc ? s.slice(1) : s, direction: desc ? 'desc' : 'asc' };
};

const applyDemoOrderAndLimit = (arr, ordStr, lim) => {
  const ord = parseOrderBy(ordStr);
  if (ord) {
    arr.sort((a, b) => {
      const av = a[ord.field], bv = b[ord.field];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return ord.direction === 'asc' ? -1 : 1;
      if (av > bv) return ord.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
  return lim ? arr.slice(0, lim) : arr;
};

function entityProxy(name) {
  return {
    name,
    async list(ordStr, lim) {
      if (!db) return applyDemoOrderAndLimit(Array.from(ensureCollection(name).values()), ordStr, lim);
      const cs = [];
      const ord = parseOrderBy(ordStr);
      if (ord) cs.push(fsOrderBy(ord.field, ord.direction));
      if (lim) cs.push(fsLimit(lim));
      const q = cs.length ? query(collection(db, name), ...cs) : collection(db, name);
      const snap = await getDocs(q);
      return snap.docs.map(normalizeDoc);
    },
    async filter(whereObj, ordStr, lim) {
      // Special-case lookups by `id`. Firestore stores the doc key separately
      // from the doc fields, so a where('id','==',x) query never matches.
      // Pages frequently call .filter({ id: someId }) expecting a single result.
      if (whereObj && whereObj.id != null) {
        const { id, ...rest } = whereObj;
        const single = await this.get(id);
        if (!single) return [];
        // If extra constraints were passed, post-filter in memory.
        if (Object.keys(rest).length > 0) {
          const matches = Object.entries(rest).every(([k, v]) => v === undefined || single[k] === v);
          return matches ? [single] : [];
        }
        return [single];
      }
      if (!db) {
        const all = Array.from(ensureCollection(name).values()).filter((d) =>
          Object.entries(whereObj || {}).every(([k, v]) => v === undefined || d[k] === v)
        );
        return applyDemoOrderAndLimit(all, ordStr, lim);
      }
      const cs = [];
      for (const [f, v] of Object.entries(whereObj || {})) {
        if (v === undefined) continue;
        cs.push(where(f, '==', v));
      }
      const ord = parseOrderBy(ordStr);
      if (ord) cs.push(fsOrderBy(ord.field, ord.direction));
      if (lim) cs.push(fsLimit(lim));
      const snap = await getDocs(query(collection(db, name), ...cs));
      return snap.docs.map(normalizeDoc);
    },
    async get(id) {
      if (!db) return ensureCollection(name).get(id) || null;
      const snap = await getDoc(doc(db, name, id));
      return snap.exists() ? normalizeDoc(snap) : null;
    },
    async create(data) {
      if (!db) {
        const id = newId();
        const created_date = new Date().toISOString();
        const obj = { id, created_date, updated_date: created_date, ...data };
        ensureCollection(name).set(id, obj);
        return obj;
      }
      const user = auth?.currentUser;
      const enriched = {
        ...data,
        created_date: serverTimestamp(),
        updated_date: serverTimestamp(),
        created_by: data.created_by ?? user?.email ?? null,
      };
      const r = await addDoc(collection(db, name), enriched);
      return normalizeDoc(await getDoc(r));
    },
    async update(id, data) {
      if (!db) {
        const existing = ensureCollection(name).get(id);
        if (!existing) throw new Error(`${name}/${id} not found`);
        const merged = { ...existing, ...data, updated_date: new Date().toISOString() };
        ensureCollection(name).set(id, merged);
        return merged;
      }
      await updateDoc(doc(db, name, id), { ...data, updated_date: serverTimestamp() });
      return normalizeDoc(await getDoc(doc(db, name, id)));
    },
    async delete(id) {
      if (!db) {
        ensureCollection(name).delete(id);
        return { id, deleted: true };
      }
      await deleteDoc(doc(db, name, id));
      return { id, deleted: true };
    },
  };
}

let cachedUserDoc = null;

async function fetchOrCreateUserDoc(fbUser) {
  if (!fbUser) return null;
  if (!db) {
    return {
      id: fbUser.uid,
      email: fbUser.email,
      full_name: fbUser.displayName || fbUser.email?.split('@')[0],
      avatar_url: fbUser.photoURL,
      role: 'user',
      user_type: 'buyer',
      onboarded: false,
      created_date: new Date().toISOString(),
    };
  }
  const ref = doc(db, 'User', fbUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  const newDoc = {
    email: fbUser.email,
    full_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'New User',
    avatar_url: fbUser.photoURL || null,
    role: 'user',
    user_type: 'buyer',
    onboarded: false,
    created_date: serverTimestamp(),
    updated_date: serverTimestamp(),
  };
  await setDoc(ref, newDoc);
  const fresh = await getDoc(ref);
  return { id: fresh.id, ...fresh.data() };
}

const authApi = {
  async me() {
    if (!auth) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    const fbUser = auth.currentUser;
    if (!fbUser) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    cachedUserDoc = await fetchOrCreateUserDoc(fbUser);
    return cachedUserDoc;
  },
  async logout(redirectUrl) {
    if (auth) { try { await signOut(auth); } catch (_) {} }
    cachedUserDoc = null;
    if (typeof window !== 'undefined') window.location.href = redirectUrl || '/';
  },
  async updateMe(data) {
    if (!auth || !auth.currentUser) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    if (data.full_name && auth.currentUser.displayName !== data.full_name) {
      try { await updateProfile(auth.currentUser, { displayName: data.full_name }); } catch (_) {}
    }
    if (db) {
      const ref = doc(db, 'User', auth.currentUser.uid);
      await setDoc(ref, { ...data, updated_date: serverTimestamp() }, { merge: true });
      const snap = await getDoc(ref);
      cachedUserDoc = { id: snap.id, ...snap.data() };
    } else {
      cachedUserDoc = { ...(cachedUserDoc || {}), ...data };
    }
    return cachedUserDoc;
  },
  async signIn(email, password) {
    if (!auth) throw new Error('Firebase auth not initialised');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return fetchOrCreateUserDoc(cred.user);
  },
  async signUp(email, password, profile = {}) {
    if (!auth) throw new Error('Firebase auth not initialised');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (profile.full_name) {
      try { await updateProfile(cred.user, { displayName: profile.full_name }); } catch (_) {}
    }
    if (db) {
      await setDoc(doc(db, 'User', cred.user.uid), {
        email,
        full_name: profile.full_name || email.split('@')[0],
        role: 'user',
        user_type: profile.user_type || 'buyer',
        onboarded: false,
        created_date: serverTimestamp(),
        updated_date: serverTimestamp(),
        ...profile,
      });
    }
    return fetchOrCreateUserDoc(cred.user);
  },
  async signInWithGoogle() {
    if (!auth || !googleProvider) throw new Error('Firebase auth not initialised');
    const cred = await signInWithPopup(auth, googleProvider);
    return fetchOrCreateUserDoc(cred.user);
  },

  /**
   * Send a password-reset email. Firebase's hosted reset page handles the rest
   * (or we can override with our own /ResetPassword route via actionCodeSettings).
   */
  async sendPasswordReset(email) {
    if (!auth) throw new Error('Firebase auth not initialised');
    if (!email) throw new Error('Email is required');
    await sendPasswordResetEmail(auth, email, {
      // After clicking the link in the email, return user to the app.
      url: typeof window !== 'undefined'
        ? `${window.location.origin}/Login`
        : 'https://localhost/Login',
      handleCodeInApp: false,
    });
    return { sent: true };
  },

  /** Verify the oobCode from the password-reset email link. */
  async verifyPasswordResetCode(oobCode) {
    if (!auth) throw new Error('Firebase auth not initialised');
    return fbVerifyPasswordResetCode(auth, oobCode);
  },

  /** Complete the reset by setting the new password. */
  async confirmPasswordReset(oobCode, newPassword) {
    if (!auth) throw new Error('Firebase auth not initialised');
    return fbConfirmPasswordReset(auth, oobCode, newPassword);
  },
  onChange(cb) {
    if (!auth) { cb(null); return () => {}; }
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { cachedUserDoc = null; cb(null); return; }
      cachedUserDoc = await fetchOrCreateUserDoc(fbUser);
      cb(cachedUserDoc);
    });
  },
  redirectToLogin(returnUrl) {
    if (typeof window === 'undefined') return;
    const ret = returnUrl ? `?return=${encodeURIComponent(returnUrl)}` : '';
    window.location.href = `/Login${ret}`;
  },
};

// Read a File/Blob as a base64 data URL.
const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Resize an image to maxDim (longest side) and re-encode to JPEG to keep
// data URLs small enough to safely store inline in Firestore docs.
const resizeImage = (file, maxDim = 1280, quality = 0.82) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

const Core = {
  /**
   * Upload a file. Tries Firebase Storage first (best — proper CDN URLs).
   * If Storage isn't enabled or rules block the write, falls back to an
   * inline base64 data URL so the app keeps working out-of-the-box.
   */
  async UploadFile({ file }) {
    if (storage) {
      try {
        const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
        const userPath = auth?.currentUser?.uid || 'public';
        const path = `uploads/${userPath}/${Date.now()}_${safeName}`;
        const r = ref(storage, path);
        await uploadBytes(r, file, { contentType: file.type || 'application/octet-stream' });
        const file_url = await getDownloadURL(r);
        return { file_url };
      } catch (err) {
        // Common causes: Storage not enabled, rules blocking the write, CORS, billing required for new bucket format.
        console.warn('[UploadFile] Firebase Storage upload failed, falling back to base64. Reason:', err?.code || err?.message || err);
      }
    }
    // --- Fallback: inline base64 data URL ----------------------------
    try {
      // Resize images to keep data URL size manageable (<800KB typically).
      if (file.type?.startsWith('image/')) {
        const file_url = await resizeImage(file, 1280, 0.82);
        return { file_url, _inline: true };
      }
      // Non-image files: just embed as data URL (no resize).
      const file_url = await readAsDataURL(file);
      return { file_url, _inline: true };
    } catch (err) {
      console.error('[UploadFile] Even base64 fallback failed:', err);
      throw err;
    }
  },
  async SendEmail(p) { console.info('[SendEmail stub]', p); return { success: true, stub: true }; },
  async SendSMS(p) { console.info('[SendSMS stub]', p); return { success: true, stub: true }; },
  async InvokeLLM(p) {
    console.info('[InvokeLLM stub]', p);
    return { response: 'LLM integration not configured. Wire a Cloud Function to enable AI responses.', stub: true };
  },
  async GenerateImage(p) { console.info('[GenerateImage stub]', p); return { image_url: null, stub: true }; },
  async ExtractDataFromUploadedFile(p) { console.info('[ExtractData stub]', p); return { data: {}, stub: true }; },
};

const functions = {
  async invoke(name, payload) {
    console.info(`[functions.invoke('${name}') stub]`, payload);
    if (name === 'createYocoCheckout') {
      return {
        data: {
          redirectUrl: null,
          message: 'Yoco checkout not configured. Add createYocoCheckout Cloud Function and Yoco secret key to enable payments.',
        },
      };
    }
    if (name === 'getSellerProfile') {
      try {
        const { created_by_id } = payload || {};
        if (created_by_id && db) {
          const snap = await getDocs(query(collection(db, 'SellerProfile'), where('created_by_id', '==', created_by_id)));
          return { data: { profile: snap.docs.map(normalizeDoc)[0] || null } };
        }
      } catch (e) { console.warn('[getSellerProfile fallback]', e); }
      return { data: { profile: null } };
    }
    return { data: { stub: true, message: `Function '${name}' not implemented.` } };
  },
};

const knownAgentMethods = {
  async createConversation(opts) {
    console.info('[agents.createConversation stub]', opts);
    return { id: 'stub_conv_' + Date.now(), agent_name: opts?.agent_name || 'cliffie' };
  },
  subscribeToConversation(_id, _cb) {
    console.info('[agents.subscribeToConversation stub]');
    return () => {};
  },
  async sendMessage(payload) {
    console.info('[agents.sendMessage stub]', payload);
    return { reply: 'AI assistant not configured. Wire a Cloud Function backed by Claude or OpenAI.' };
  },
  getWhatsAppConnectURL(agentName) {
    const number = (typeof window !== 'undefined' && window?.__EASYPOULTRY_WHATSAPP_NUMBER) || '27000000000';
    const text = encodeURIComponent(`Hi! I'd like to chat with the ${agentName || 'Easy Poultry'} assistant.`);
    return `https://wa.me/${number}?text=${text}`;
  },
};

const agents = new Proxy(knownAgentMethods, {
  get(target, prop) {
    if (prop in target) return target[prop];
    return (...args) => {
      console.info(`[agents.${String(prop)} stub]`, args);
      return Promise.resolve(null);
    };
  },
});

const appLogs = {
  async logUserInApp(pageName) {
    return { logged: false, pageName };
  },
};

const entityNames = [
  'AdminSettings','Auction','AuctionBid','AuctionEvent','AuctionHouse',
  'AuctionHousePayment','AuctionHouseTier','AuctionItem','AuctionPayment',
  'AuctionRegistration','BankingInfo','BatchExpense','Chat','ChatMessage',
  'Competition','CompetitionEntry','CompetitionRating','CompetitionWinner',
  'EggIncubation','EggProduction','EmailCampaign','FarmAlert',
  'FeaturePayment','FeaturePricing','FeedPurchase','FeedSupplier',
  'FeedType','FeedUsage','IncubationLog','Inquiry','Listing',
  'Notification','PoultryBatch','Prospect','Query','SavedListing',
  'SellerProfile','SellerReview','SellerTier','TierUpgradePayment',
  'User','VaccinationEvent','VaccineType','VerificationPayment',
  'YocoTransactionLog',
];

const entities = {};
for (const n of entityNames) entities[n] = entityProxy(n);

const entitiesProxy = new Proxy(entities, {
  get(target, prop) {
    if (typeof prop !== 'string') return undefined;
    if (!target[prop]) target[prop] = entityProxy(prop);
    return target[prop];
  },
});

export const api = {
  entities: entitiesProxy,
  auth: authApi,
  integrations: { Core },
  functions,
  agents,
  appLogs,
  _backend: isFirebaseConfigured ? 'firebase' : 'demo',
};

export default api;
