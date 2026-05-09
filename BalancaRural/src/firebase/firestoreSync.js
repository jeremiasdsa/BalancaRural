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

export async function initCloudSync(ownerId, options = {}) {
  if (!ownerId) {
    return {
      enabled: false,
      message: "Dados locais neste aparelho."
    };
  }

  if (!isFirebaseConfigured()) {
    return {
      enabled: false,
      message: "Firebase não configurado."
    };
  }

  try {
    if (options.localOwnerId && options.localOwnerId !== ownerId) {
      await mergeLocalAndCloudData(ownerId, options.localOwnerId);
    } else {
      await pullFirebaseToLocal(ownerId);
    }
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

export async function mirrorOwnerData(sourceOwnerId, targetOwnerId) {
  if (!sourceOwnerId || !targetOwnerId || sourceOwnerId === targetOwnerId) return;

  const [sourceData, targetData] = await Promise.all([
    readLocalOwnerData(sourceOwnerId),
    readLocalOwnerData(targetOwnerId)
  ]);
  const merged = mergeOwnerData(targetData, sourceData, targetOwnerId);

  await writeLocalOwnerData(targetOwnerId, merged);
  await ensureValidActiveProperty(targetOwnerId);
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
  const cloudData = await readCloudOwnerData(ownerId);
  if (!cloudData) return false;

  await writeLocalOwnerData(ownerId, cloudData);
  return true;
}

async function mergeLocalAndCloudData(ownerId, localOwnerId) {
  const [localData, currentOwnerData, cloudData, localPending] = await Promise.all([
    readLocalOwnerData(localOwnerId),
    readLocalOwnerData(ownerId),
    readCloudOwnerData(ownerId),
    readPendingCloudOperations(localOwnerId)
  ]);
  const mergedLocalData = mergeOwnerData(currentOwnerData, localData, ownerId);
  const merged = applyPendingOperations(
    mergeOwnerData(mergedLocalData, cloudData ?? createOwnerData(), ownerId),
    localPending
  );

  await writeLocalOwnerData(ownerId, merged);
  await writeOne(STORES.appState, {
    key: getPendingKey(ownerId),
    ownerId,
    value: localPending
  });
  return true;
}

async function readCloudOwnerData(ownerId) {
  const db = await getFirebaseDb();
  if (!db) return null;
  const { collection, getDocs } = await getFirestoreSdk();

  const [propertiesSnapshot, recordsSnapshot, appStateSnapshot] = await Promise.all([
    getDocs(userCollection(db, ownerId, COLLECTIONS.properties, collection)),
    getDocs(userCollection(db, ownerId, COLLECTIONS.weightRecords, collection)),
    getDocs(userCollection(db, ownerId, COLLECTIONS.appState, collection))
  ]);

  const data = createOwnerData();

  for (const propertyDoc of propertiesSnapshot.docs) {
    data.properties.push({
      ...propertyDoc.data(),
      ownerId,
      id: propertyDoc.data().id || propertyDoc.id
    });
  }

  for (const recordDoc of recordsSnapshot.docs) {
    data.records.push({
      ...recordDoc.data(),
      ownerId,
      id: recordDoc.data().id || recordDoc.id
    });
  }

  const activePropertyDoc = appStateSnapshot.docs.find((item) => item.id === "activePropertyId");
  if (activePropertyDoc?.data()?.value) {
    data.activePropertyId = activePropertyDoc.data().value;
  }

  return data;
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
  const pending = await readPendingCloudOperations(ownerId);

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
    key: getPendingKey(ownerId),
    ownerId,
    value: createPendingQueue()
  });
}

async function readPendingCloudOperations(ownerId) {
  return normalizePendingQueue((await readOne(STORES.appState, getPendingKey(ownerId)))?.value);
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

function applyPendingOperations(data, pending) {
  const deletedProperties = new Set(pending.propertyDeletions);
  const clearedHistoryProperties = new Set([...pending.propertyHistoryClears, ...pending.propertyDeletions]);
  const deletedRecords = new Set(pending.weightRecordDeletions);

  return {
    properties: data.properties.filter((property) => !deletedProperties.has(property.id)),
    records: data.records.filter((record) => {
      return !deletedRecords.has(record.id) && !clearedHistoryProperties.has(record.propertyId);
    }),
    activePropertyId: deletedProperties.has(data.activePropertyId) ? null : data.activePropertyId
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

async function readLocalOwnerData(ownerId) {
  const [properties, records, activePropertyId] = await Promise.all([
    listProperties(ownerId),
    listAllWeightRecords(ownerId),
    getActivePropertyId(ownerId)
  ]);

  return {
    properties,
    records,
    activePropertyId
  };
}

async function writeLocalOwnerData(ownerId, data) {
  for (const property of data.properties) {
    await writeOne(STORES.properties, {
      ...property,
      ownerId
    });
  }

  for (const record of data.records) {
    await writeOne(STORES.weightRecords, {
      ...record,
      ownerId
    });
  }

  if (data.activePropertyId) {
    await setActivePropertyId(data.activePropertyId, ownerId);
  }
}

function createOwnerData() {
  return {
    properties: [],
    records: [],
    activePropertyId: null
  };
}

function mergeOwnerData(base, incoming, ownerId) {
  return {
    properties: mergeById(base.properties, incoming.properties, ownerId),
    records: mergeById(base.records, incoming.records, ownerId),
    activePropertyId: incoming.activePropertyId || base.activePropertyId || null
  };
}

function mergeById(baseItems, incomingItems, ownerId) {
  const byId = new Map();

  [...baseItems, ...incomingItems].forEach((item) => {
    if (!item?.id) return;

    const normalized = {
      ...item,
      ownerId
    };
    const current = byId.get(item.id);
    byId.set(item.id, chooseLatest(current, normalized));
  });

  return [...byId.values()];
}

function chooseLatest(current, next) {
  if (!current) return next;
  return getComparableDate(next) >= getComparableDate(current) ? next : current;
}

function getComparableDate(item) {
  const value = item.updatedAt || item.timestamp || item.createdAt || "";
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}
