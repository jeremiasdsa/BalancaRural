import { getFirebaseAuth, isFirebaseConfigured } from "./firebaseClient.js";

const OFFLINE_AUTH_KEY = "balancaRural.offlineAuthUser";

let authModule = null;

export async function observeAuthState(callback) {
  if (!isFirebaseConfigured()) {
    callback(getOfflineAuthUser());
    return () => {};
  }

  const offlineUser = getOfflineAuthUser();
  let authSettled = false;
  let fallbackSent = false;

  const fallbackTimer = window.setTimeout(() => {
    if (!authSettled && offlineUser) {
      fallbackSent = true;
      callback(offlineUser);
    }
  }, navigator.onLine ? 3000 : 500);

  try {
    const auth = await getFirebaseAuth();
    const { onAuthStateChanged } = await getAuthModule();
    return onAuthStateChanged(auth, (user) => {
      authSettled = true;
      window.clearTimeout(fallbackTimer);

      if (user) {
        saveOfflineAuthUser(user);
        callback(user);
        return;
      }

      clearOfflineAuthUser();
      if (!fallbackSent) callback(null);
    });
  } catch (error) {
    authSettled = true;
    window.clearTimeout(fallbackTimer);
    if (offlineUser && !fallbackSent) {
      callback(offlineUser);
      return () => {};
    }
    if (offlineUser) return () => {};
    throw error;
  }
}

export async function signInWithEmail(email, password) {
  const auth = await requireAuth();
  const { signInWithEmailAndPassword } = await getAuthModule();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function createAccountWithEmail(email, password) {
  const auth = await requireAuth();
  const { createUserWithEmailAndPassword } = await getAuthModule();
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function sendResetEmail(email) {
  const auth = await requireAuth();
  const { sendPasswordResetEmail } = await getAuthModule();
  return sendPasswordResetEmail(auth, email);
}

export async function resolveOnlineAuthUser(timeoutMs = 12000) {
  const auth = await requireAuth();
  const { onAuthStateChanged } = await getAuthModule();
  if (auth.currentUser) {
    saveOfflineAuthUser(auth.currentUser);
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    let unsubscribe = () => {};
    const timer = window.setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, timeoutMs);
    unsubscribe = onAuthStateChanged(auth, (user) => {
      window.clearTimeout(timer);
      unsubscribe();
      if (user) saveOfflineAuthUser(user);
      resolve(user);
    });
  });
}

export async function signOutUser() {
  clearOfflineAuthUser();
  const auth = await requireAuth();
  const { signOut } = await getAuthModule();
  return signOut(auth);
}

export function getAuthErrorMessage(error) {
  const code = error?.code ?? "";

  if (code === "auth/invalid-email") return "Informe um email válido.";
  if (code === "auth/missing-password") return "Informe sua senha.";
  if (code === "auth/weak-password") return "Use uma senha com pelo menos 6 caracteres.";
  if (code === "auth/email-already-in-use") return "Este email já possui uma conta.";
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Email ou senha inválidos.";
  }
  if (code === "auth/network-request-failed") {
    return "Conexão necessária para entrar, criar conta ou recuperar senha.";
  }

  return "Não foi possível concluir a autenticação.";
}

async function requireAuth() {
  const auth = await getFirebaseAuth();
  if (!auth) throw new Error("Firebase Authentication não configurado.");
  return auth;
}

async function getAuthModule() {
  if (!authModule) {
    authModule = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
  }

  return authModule;
}

function saveOfflineAuthUser(user) {
  try {
    localStorage.setItem(OFFLINE_AUTH_KEY, JSON.stringify({
      uid: user.uid,
      email: user.email ?? ""
    }));
  } catch (error) {
    console.warn("Não foi possível salvar a sessão offline.", error);
  }
}

function getOfflineAuthUser() {
  try {
    const stored = JSON.parse(localStorage.getItem(OFFLINE_AUTH_KEY) ?? "null");
    if (!stored?.uid) return null;
    return {
      uid: stored.uid,
      email: stored.email ?? "",
      isOfflineSession: true
    };
  } catch {
    return null;
  }
}

function clearOfflineAuthUser() {
  try {
    localStorage.removeItem(OFFLINE_AUTH_KEY);
  } catch (error) {
    console.warn("Não foi possível limpar a sessão offline.", error);
  }
}
