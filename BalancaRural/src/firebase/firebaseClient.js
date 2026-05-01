import { firebaseConfig, firebaseSyncEnabled } from "./config.js";

let firestoreDb = null;
let firebaseModules = null;

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

  const { initializeApp, getApps, getFirestore } = await getFirebaseModules();
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  firestoreDb = getFirestore(app);
  return firestoreDb;
}

async function getFirebaseModules() {
  if (!firebaseModules) {
    const [appModule, firestoreModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js")
    ]);

    firebaseModules = {
      initializeApp: appModule.initializeApp,
      getApps: appModule.getApps,
      getFirestore: firestoreModule.getFirestore
    };
  }

  return firebaseModules;
}
