import {
  createAccountWithEmail,
  getAuthErrorMessage,
  sendResetEmail,
  signInWithEmail
} from "../../firebase/auth.js";

export async function submitAuthForm({ formData, mode }) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email) {
    return { ok: false, error: "Informe seu email." };
  }

  if (mode !== "reset" && !password) {
    return { ok: false, error: "Informe sua senha." };
  }

  try {
    if (mode === "login") {
      await signInWithEmail(email, password);
      return { ok: true };
    }

    if (mode === "signup") {
      await createAccountWithEmail(email, password);
      return { ok: true };
    }

    await sendResetEmail(email);
    return { ok: true, message: "Email de recuperação enviado." };
  } catch (error) {
    return { ok: false, error: getAuthErrorMessage(error) };
  }
}
