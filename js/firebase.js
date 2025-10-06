// Firebase adapter for this project
// Loads Firebase compat SDK via CDN if not present and exposes a small API

let firebaseClient = null;
let _resolveFirebaseReady;
export const firebaseReady = new Promise((res) => {
  _resolveFirebaseReady = res;
});

const CDN_BASE = "https://www.gstatic.com/firebasejs/9.22.1";
const SCRIPTS = [
  `${CDN_BASE}/firebase-app-compat.js`,
  `${CDN_BASE}/firebase-auth-compat.js`,
  `${CDN_BASE}/firebase-firestore-compat.js`,
];

function initializeFirebase() {
  try {
    // If the host page initialized the modular SDK and exposed auth/db, use those
    if (window.FIREBASE_AUTH && window.FIREBASE_DB && window.FIREBASE_CONFIG) {
      firebaseClient = {
        auth: window.FIREBASE_AUTH,
        db: window.FIREBASE_DB,
        firebase: window.firebase || null,
      };
      console.log(
        "Firebase client initialized from host-provided modular SDK globals"
      );
      try {
        _resolveFirebaseReady(firebaseClient);
      } catch (e) {
        /* ignore */
      }
      return;
    }

    const config = window.FIREBASE_CONFIG;
    if (!config) {
      console.error(
        "window.FIREBASE_CONFIG is not defined. Create a `js/firebase-config.js` that sets it or provide via your build system."
      );
      _resolveFirebaseReady(null);
      return;
    }

    if (!window.firebase) {
      console.error(
        "Firebase SDK not loaded despite loader; aborting initialization"
      );
      _resolveFirebaseReady(null);
      return;
    }

    // Avoid double init
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(config);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    firebaseClient = { firebase, auth, db };
    console.log("Firebase client initialized");
    try {
      _resolveFirebaseReady(firebaseClient);
    } catch (e) {
      /* ignore */
    }
  } catch (err) {
    console.error("Firebase initialization error:", err);
    try {
      _resolveFirebaseReady(null);
    } catch (e) {
      /* ignore */
    }
  }
}

function loadScripts() {
  // avoid duplicate injection
  const existing = SCRIPTS.find((src) =>
    document.querySelector(`script[src="${src}"]`)
  );
  if (existing || window.firebase) {
    // give a tick for firebase to be available
    setTimeout(initializeFirebase, 50);
    return;
  }

  let loaded = 0;
  SCRIPTS.forEach((src) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      loaded += 1;
      if (loaded === SCRIPTS.length) {
        setTimeout(initializeFirebase, 50);
      }
    };
    s.onerror = (e) => {
      console.error("Failed to load Firebase SDK script:", src, e);
      try {
        _resolveFirebaseReady(null);
      } catch (er) {
        /* ignore */
      }
    };
    document.head.appendChild(s);
  });

  // timeout
  setTimeout(() => {
    if (!firebaseClient) {
      console.error("Firebase SDK load timed out");
      try {
        _resolveFirebaseReady(null);
      } catch (er) {
        /* ignore */
      }
    }
  }, 10000);
}

// start loader
if (typeof window !== "undefined") loadScripts();

// Helper: fetch profile document from Firestore
async function fetchProfile(uid) {
  try {
    const doc = await firebaseClient.db.collection("profiles").doc(uid).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (e) {
    console.error("fetchProfile error:", e);
    return null;
  }
}

// Public API
export async function signUp(email, password, fullName) {
  if (!firebaseClient)
    return { data: null, error: new Error("Firebase not initialized") };
  try {
    const userCred = await firebaseClient.auth.createUserWithEmailAndPassword(
      email,
      password
    );
    const user = userCred.user;
    // create profile
    const profile = {
      id: user.uid,
      email,
      full_name: fullName,
      role: "user",
      status: "active",
      balances: { USD: 0, BTC: 0, ETH: 0 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      settings: { dark_mode: true, notifications: true, biometric: false },
    };
    await firebaseClient.db.collection("profiles").doc(user.uid).set(profile);
    // send verification email
    try {
      await user.sendEmailVerification();
    } catch (_) {}
    return { data: { user, profile }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signIn(email, password) {
  if (!firebaseClient)
    return { data: null, error: new Error("Firebase not initialized") };
  try {
    const cred = await firebaseClient.auth.signInWithEmailAndPassword(
      email,
      password
    );
    const user = cred.user;
    const profile = await fetchProfile(user.uid);
    return { data: { user, profile }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signOut() {
  if (!firebaseClient) return { error: new Error("Firebase not initialized") };
  try {
    await firebaseClient.auth.signOut();
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function resetPassword(email) {
  if (!firebaseClient) return { error: new Error("Firebase not initialized") };
  try {
    await firebaseClient.auth.sendPasswordResetEmail(email);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function resendConfirmation(email) {
  // Firebase doesn't allow sending verification without a signed-in user.
  // Return a helpful error hint.
  return {
    error: new Error(
      "resendConfirmation requires the user to be signed in. Sign in and call currentUser.sendEmailVerification()."
    ),
  };
}

export async function getCurrentUser() {
  if (!firebaseClient) return { user: null, profile: null };
  const user = firebaseClient.auth.currentUser || null;
  if (!user) return { user: null, profile: null };
  const profile = await fetchProfile(user.uid);
  return { user, profile };
}

export async function updateUserProfile(userId, updates) {
  if (!firebaseClient)
    return { data: null, error: new Error("Firebase not initialized") };
  try {
    await firebaseClient.db.collection("profiles").doc(userId).update(updates);
    const doc = await firebaseClient.db
      .collection("profiles")
      .doc(userId)
      .get();
    return { data: { id: doc.id, ...doc.data() }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// export the internal client for advanced usage (will be null if not initialized)
export function getFirebaseClient() {
  return firebaseClient;
}
