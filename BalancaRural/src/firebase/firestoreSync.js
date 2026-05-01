import { listProperties, setActivePropertyId } from "../data/repositories/propertiesRepository.js";
import { writeOne, STORES } from "../data/db/indexedDb.js";
import { listAllWeightRecords } from "../data/repositories/weightRecordsRepository.js";
import { getFirebaseDb, isFirebaseConfigured } from "./firebaseClient.js";

const COLLECTIONS = {
  properties: "properties",
  weightRecords: "weightRecords",
  appState: "appState"
};

let firestoreSdk = null;

export async function initCloudSync() {
  if (!isFirebaseConfigured()) {
    return {
      enabled: false,
      message: "Firebase não configurado."
    };
  }

  try {
    await pullFirebaseToLocal();
    await syncAllLocalData();
    return {
      enabled: true,
      message: "Firebase conectado."
    };
  } catch (error) {
    console.warn("Falha ao iniciar sincronização Firebase", error);
    return {
      enabled: false,
      message: "Firebase indisponível."
    };
  }
}

export async function syncAllLocalData() {
  const db = await getFirebaseDb();
  if (!db) return false;
  const { doc, writeBatch } = await getFirestoreSdk();

  const [properties, records] = await Promise.all([
    listProperties(),
    listAllWeightRecords()
  ]);

  const batch = writeBatch(db);
  properties.forEach((property) => {
    batch.set(doc(db, COLLECTIONS.properties, property.id), property);
  });
  records.forEach((record) => {
    batch.set(doc(db, COLLECTIONS.weightRecords, record.id), record);
  });

  await batch.commit();
  return true;
}

export async function syncProperty(property) {
  const db = await getFirebaseDb();
  if (!db || !property) return false;
  const { doc, setDoc } = await getFirestoreSdk();

  await setDoc(doc(db, COLLECTIONS.properties, property.id), property);
  return true;
}

export async function syncPropertyDeletion(propertyId) {
  const db = await getFirebaseDb();
  if (!db || !propertyId) return false;
  const { deleteDoc, doc } = await getFirestoreSdk();

  await deleteDoc(doc(db, COLLECTIONS.properties, propertyId));
  await syncPropertyHistoryClear(propertyId);
  return true;
}

export async function syncWeightRecord(record) {
  const db = await getFirebaseDb();
  if (!db || !record) return false;
  const { doc, setDoc } = await getFirestoreSdk();

  await setDoc(doc(db, COLLECTIONS.weightRecords, record.id), record);
  return true;
}

export async function syncWeightRecordDeletion(recordId) {
  const db = await getFirebaseDb();
  if (!db || !recordId) return false;
  const { deleteDoc, doc } = await getFirestoreSdk();

  await deleteDoc(doc(db, COLLECTIONS.weightRecords, recordId));
  return true;
}

export async function syncPropertyHistoryClear(propertyId) {
  const db = await getFirebaseDb();
  if (!db || !propertyId) return false;
  const { collection, getDocs, query, where, writeBatch } = await getFirestoreSdk();

  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.weightRecords), where("propertyId", "==", propertyId))
  );

  if (snapshot.empty) return true;

  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
  return true;
}

export async function syncWeightRecordsDeletion(recordIds) {
  const db = await getFirebaseDb();
  if (!db || !recordIds.length) return false;
  const { doc, writeBatch } = await getFirestoreSdk();

  const batch = writeBatch(db);
  recordIds.forEach((id) => batch.delete(doc(db, COLLECTIONS.weightRecords, id)));
  await batch.commit();
  return true;
}

async function pullFirebaseToLocal() {
  const db = await getFirebaseDb();
  if (!db) return false;
  const { collection, getDocs } = await getFirestoreSdk();

  const [propertiesSnapshot, recordsSnapshot, appStateSnapshot] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.properties)),
    getDocs(collection(db, COLLECTIONS.weightRecords)),
    getDocs(collection(db, COLLECTIONS.appState))
  ]);

  for (const propertyDoc of propertiesSnapshot.docs) {
    await writeOne(STORES.properties, propertyDoc.data());
  }

  for (const recordDoc of recordsSnapshot.docs) {
    await writeOne(STORES.weightRecords, recordDoc.data());
  }

  const activePropertyDoc = appStateSnapshot.docs.find((item) => item.id === "activePropertyId");
  if (activePropertyDoc?.data()?.value) {
    await setActivePropertyId(activePropertyDoc.data().value);
  }

  return true;
}

export async function syncActiveProperty(propertyId) {
  const db = await getFirebaseDb();
  if (!db) return false;
  const { doc, setDoc } = await getFirestoreSdk();

  await setDoc(doc(db, COLLECTIONS.appState, "activePropertyId"), {
    key: "activePropertyId",
    value: propertyId
  });
  return true;
}

async function getFirestoreSdk() {
  if (!firestoreSdk) {
    firestoreSdk = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
  }

  return firestoreSdk;
}
