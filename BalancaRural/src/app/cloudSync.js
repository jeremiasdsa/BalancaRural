import { initCloudSync } from "../firebase/firestoreSync.js";

export async function runCloudSyncWithStatus(ownerId) {
  return Promise.race([
    initCloudSync(ownerId),
    new Promise((resolve) => {
      window.setTimeout(() => resolve({
        enabled: false,
        message: "Firebase demorou para responder. Dados locais preservados."
      }), 15000);
    })
  ]);
}

export async function runCloudSyncOperation({ cloud, getOwnerId, onCloudUnavailable, operation }) {
  const ownerId = getOwnerId();
  if (!ownerId || !cloud.enabled) return false;

  try {
    await operation(ownerId);
    return true;
  } catch (error) {
    console.warn("Falha ao sincronizar com Firebase", error);
    onCloudUnavailable();
    return false;
  }
}
