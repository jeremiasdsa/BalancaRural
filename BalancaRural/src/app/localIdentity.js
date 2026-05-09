import { createId } from "../utils/id.js";

const LOCAL_OWNER_KEY = "balancaRural.localOwnerId";

let cachedLocalOwnerId = null;

export function getLocalOwnerId() {
  if (cachedLocalOwnerId) return cachedLocalOwnerId;

  try {
    const stored = localStorage.getItem(LOCAL_OWNER_KEY);
    if (stored) {
      cachedLocalOwnerId = stored;
      return cachedLocalOwnerId;
    }

    cachedLocalOwnerId = createId("local-owner");
    localStorage.setItem(LOCAL_OWNER_KEY, cachedLocalOwnerId);
    return cachedLocalOwnerId;
  } catch (error) {
    console.warn("Não foi possível persistir a identidade local.", error);
    cachedLocalOwnerId = createId("local-owner");
    return cachedLocalOwnerId;
  }
}

export function createLocalUser() {
  return {
    uid: getLocalOwnerId(),
    email: "",
    isLocal: true
  };
}

export function isLocalUser(user) {
  return Boolean(user?.isLocal);
}
