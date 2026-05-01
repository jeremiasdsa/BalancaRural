const DB_NAME = "balanca-rural";
const DB_VERSION = 1;

export const STORES = {
  properties: "properties",
  weightRecords: "weightRecords",
  appState: "appState"
};

let dbPromise;

export function getDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(STORES.properties)) {
          db.createObjectStore(STORES.properties, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.weightRecords)) {
          const store = db.createObjectStore(STORES.weightRecords, { keyPath: "id" });
          store.createIndex("propertyId", "propertyId", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.appState)) {
          db.createObjectStore(STORES.appState, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

export async function readAll(storeName) {
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readOne(storeName, key) {
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(key);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function writeOne(storeName, value) {
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteOne(storeName, key) {
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
