import {
  ensureValidActiveProperty,
  getActivePropertyId,
  listProperties,
  setActivePropertyId
} from "../data/repositories/propertiesRepository.js";
import { readOne, writeOne, STORES } from "../data/db/indexedDb.js";
import { listAllWeightRecords } from "../data/repositories/weightRecordsRepository.js";
import { getFirebaseDb, isFirebaseConfigured } from "./firebaseClient.js";

const COLLECTIONS = {
  users: "users",
  properties: "properties",
  weightRecords: "weightRecords",
  appState: "appState"
};

let firestoreSdk = null;

export async function initCloudSync(ownerId) {
  if (!ownerId) {
    return {
      enabled: false,
      message: "Aguardando login."
    };
  }

  if (!isFirebaseConfigured()) {
    return {
      enabled: false,
      message: "Firebase não configurado."
    };
  }

  try {
    await pullFirebaseToLocal(ownerId);
    await ensureValidActiveProperty(ownerId);
    await flushPendingCloudOperations(ownerId);
    await syncAllLocalData(ownerId);
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

export async function syncAllLocalData(ownerId) {
  if (!ownerId) return false;
  const db = await getFirebaseDb();
  if (!db) return false;
  const { doc, writeBatch } = await getFirestoreSdk();

  const [properties, records] = await Promise.all([
    listProperties(ownerId),
    listAllWeightRecords(ownerId)
  ]);
  const activePropertyId = await getActivePropertyId(ownerId);

  const batch = writeBatch(db);
  properties.forEach((property) => {
    batch.set(userDoc(db, ownerId, COLLECTIONS.properties, property.id, doc), property);
  });
  records.forEach((record) => {
    batch.set(userDoc(db, ownerId, COLLECTIONS.weightRecords, record.id, doc), record);
  });
  batch.set(userDoc(db, ownerId, COLLECTIONS.appState, "activePropertyId", doc), {
    key: "activePropertyId",
    ownerId,
    value: activePropertyId
  });

  await batch.commit();
  return true;
}

export async function syncProperty(ownerId, property) {
  if (!ownerId) return false;
  const db = await getFirebaseDb();
  if (!db || !property) return false;
  const { doc, setDoc } = await getFirestoreSdk();

  await setDoc(userDoc(db, ownerId, COLLECTIONS.properties, property.id, doc), property);
  return true;
}

export async function syncPropertyDeletion(ownerId, propertyId) {
  if (!ownerId) return false;
  const db = await getFirebaseDb();
  if (!db || !propertyId) return false;
  const { deleteDoc, doc } = await getFirestoreSdk();

  await deleteDoc(userDoc(db, ownerId, COLLECTIONS.properties, propertyId, doc));
  await syncPropertyHistoryClear(ownerId, propertyId);
  return true;
}

export async function syncWeightRecord(ownerId, record) {
  if (!ownerId) return false;
  const db = await getFirebaseDb();
  if (!db || !record) return false;
  const { doc, setDoc } = await getFirestoreSdk();

  await setDoc(userDoc(db, ownerId, COLLECTIONS.weightRecords, record.id, doc), record);
  return true;
}

export async function syncWeightRecordDeletion(ownerId, recordId) {
  if (!ownerId) return false;
  const db = await getFirebaseDb();
  if (!db || !recordId) return false;
  const { deleteDoc, doc } = await getFirestoreSdk();

  await deleteDoc(userDoc(db, ownerId, COLLECTIONS.weightRecords, recordId, doc));
  return true;
}

export async function syncPropertyHistoryClear(ownerId, propertyId) {
  if (!ownerId) return false;
  const db = await getFirebaseDb();
  if (!db || !propertyId) return false;
  const { collection, getDocs, query, where, writeBatch } = await getFirestoreSdk();

  const snapshot = await getDocs(
    query(userCollection(db, ownerId, COLLECTIONS.weightRecords, collection), where("propertyId", "==", propertyId))
  );

  if (snapshot.empty) return true;

  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
  return true;
}

export async function syncWeightRecordsDeletion(ownerId, recordIds) {
  if (!ownerId) return false;
  const db = await getFirebaseDb();
  if (!db || !recordIds.length) return false;
  const { doc, writeBatch } = await getFirestoreSdk();

  const batch = writeBatch(db);
  recordIds.forEach((id) => batch.delete(userDoc(db, ownerId, COLLECTIONS.weightRecords, id, doc)));
  await batch.commit();
  return true;
}

async function pullFirebaseToLocal(ownerId) {
  const db = await getFirebaseDb();
  if (!db) return false;
  const { collection, getDocs } = await getFirestoreSdk();

  const [propertiesSnapshot, recordsSnapshot, appStateSnapshot] = await Promise.all([
    getDocs(userCollection(db, ownerId, COLLECTIONS.properties, collection)),
    getDocs(userCollection(db, ownerId, COLLECTIONS.weightRecords, collection)),
    getDocs(userCollection(db, ownerId, COLLECTIONS.appState, collection))
  ]);

  for (const propertyDoc of propertiesSnapshot.docs) {
    await writeOne(STORES.properties, {
      ...propertyDoc.data(),
      ownerId,
      id: propertyDoc.data().id || propertyDoc.id
    });
  }

  for (const recordDoc of recordsSnapshot.docs) {
    await writeOne(STORES.weightRecords, {
      ...recordDoc.data(),
      ownerId,
      id: recordDoc.data().id || recordDoc.id
    });
  }

  const activePropertyDoc = appStateSnapshot.docs.find((item) => item.id === "activePropertyId");
  if (activePropertyDoc?.data()?.value) {
    await setActivePropertyId(activePropertyDoc.data().value, ownerId);
  }

  return true;
}

export async function syncActiveProperty(ownerId, propertyId) {
  if (!ownerId) return false;
  const db = await getFirebaseDb();
  if (!db) return false;
  const { doc, setDoc } = await getFirestoreSdk();

  await setDoc(userDoc(db, ownerId, COLLECTIONS.appState, "activePropertyId", doc), {
    key: "activePropertyId",
    ownerId,
    value: propertyId
  });
  return true;
}

export async function queuePendingCloudOperation(ownerId, operation) {
  if (!ownerId || !operation?.type) return;

  const key = getPendingKey(ownerId);
  const current = (await readOne(STORES.appState, key))?.value ?? createPendingQueue();
  const next = normalizePendingQueue(current);

  if (operation.type === "propertyDeletion" && operation.propertyId) {
    next.propertyDeletions = [...new Set([...next.propertyDeletions, operation.propertyId])];
  }

  if (operation.type === "propertyHistoryClear" && operation.propertyId) {
    next.propertyHistoryClears = [...new Set([...next.propertyHistoryClears, operation.propertyId])];
  }

  if (operation.type === "weightRecordDeletion" && operation.recordId) {
    next.weightRecordDeletions = [...new Set([...next.weightRecordDeletions, operation.recordId])];
  }

  if (operation.type === "weightRecordsDeletion" && operation.recordIds?.length) {
    next.weightRecordDeletions = [...new Set([...next.weightRecordDeletions, ...operation.recordIds])];
  }

  await writeOne(STORES.appState, {
    key,
    ownerId,
    value: next
  });
}

async function flushPendingCloudOperations(ownerId) {
  const key = getPendingKey(ownerId);
  const pending = normalizePendingQueue((await readOne(STORES.appState, key))?.value);

  for (const propertyId of pending.propertyHistoryClears) {
    await syncPropertyHistoryClear(ownerId, propertyId);
  }

  for (const recordId of pending.weightRecordDeletions) {
    await syncWeightRecordDeletion(ownerId, recordId);
  }

  for (const propertyId of pending.propertyDeletions) {
    await syncPropertyDeletion(ownerId, propertyId);
  }

  await writeOne(STORES.appState, {
    key,
    ownerId,
    value: createPendingQueue()
  });
}

function getPendingKey(ownerId) {
  return `pendingCloudOperations:${ownerId}`;
}

function createPendingQueue() {
  return {
    propertyDeletions: [],
    propertyHistoryClears: [],
    weightRecordDeletions: []
  };
}

function normalizePendingQueue(queue = {}) {
  return {
    propertyDeletions: Array.isArray(queue.propertyDeletions) ? queue.propertyDeletions : [],
    propertyHistoryClears: Array.isArray(queue.propertyHistoryClears) ? queue.propertyHistoryClears : [],
    weightRecordDeletions: Array.isArray(queue.weightRecordDeletions) ? queue.weightRecordDeletions : []
  };
}

function userCollection(db, ownerId, collectionName, collection) {
  return collection(db, COLLECTIONS.users, ownerId, collectionName);
}

function userDoc(db, ownerId, collectionName, id, doc) {
  return doc(db, COLLECTIONS.users, ownerId, collectionName, id);
}

async function getFirestoreSdk() {
  if (!firestoreSdk) {
    firestoreSdk = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
  }

  return firestoreSdk;
}
