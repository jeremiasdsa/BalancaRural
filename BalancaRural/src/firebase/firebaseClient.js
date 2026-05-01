import { firebaseConfig, firebaseSyncEnabled } from "./config.js";

let firestoreDb = null;
let firebaseApp = null;
let appModule = null;
let firestoreModule = null;
let authModule = null;

export function isFirebaseConfigured() {
  return Boolean(
    firebaseSyncEnabled &&
      firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

export async function getFirebaseDb() {
  if (!isFirebaseConfigured()) return null;
  if (firestoreDb) return firestoreDb;

  const app = await getFirebaseApp();
  const { getFirestore } = await getFirestoreModule();
  firestoreDb = getFirestore(app);
  return firestoreDb;
}

export async function getFirebaseAuth() {
  if (!isFirebaseConfigured()) return null;
  const app = await getFirebaseApp();
  const { getAuth } = await getAuthModule();
  return getAuth(app);
}

async function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;
  const { initializeApp, getApps } = await getAppModule();
  firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return firebaseApp;
}

async function getAppModule() {
  if (!appModule) {
    appModule = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js");
  }

  return appModule;
}

async function getFirestoreModule() {
  if (!firestoreModule) {
    firestoreModule = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
  }

  return firestoreModule;
}

export async function getAuthModule() {
  if (!authModule) {
    authModule = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
  }

  return authModule;
}
