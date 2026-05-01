import { getFirebaseAuth, isFirebaseConfigured } from "./firebaseClient.js";

let authModule = null;

export async function observeAuthState(callback) {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }

  const auth = await getFirebaseAuth();
  const { onAuthStateChanged } = await getAuthModule();
  return onAuthStateChanged(auth, callback);
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

export async function signOutUser() {
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
