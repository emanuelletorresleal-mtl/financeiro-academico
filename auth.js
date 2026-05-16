import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { auth, firebaseReady } from "./firebase-config.js";

const provider = new GoogleAuthProvider();
let elements = {};

// Centraliza a sessão: login, logout e reação a mudanças do Firebase Auth.
export function initAuthUI({ onLogin, onLogout, onError }) {
  elements = {
    appShell: document.querySelector(".app-shell"),
    loginScreen: document.querySelector("#loginScreen"),
    loginButton: document.querySelector("#loginGoogle"),
    logoutButton: document.querySelector("#logoutGoogle"),
    userPanel: document.querySelector("#userPanel"),
    userPhoto: document.querySelector("#userPhoto"),
    userName: document.querySelector("#userName"),
    userEmail: document.querySelector("#userEmail"),
    syncStatus: document.querySelector("#syncStatus"),
    loginHint: document.querySelector("#loginHint"),
  };

  elements.loginButton.addEventListener("click", signInWithGoogle);
  elements.logoutButton.addEventListener("click", () => signOut(auth));

  getRedirectResult(auth).catch((error) => onError?.(error));

  onAuthStateChanged(auth, (user) => {
    if (user) {
      showUser(user);
      onLogin?.(user);
    } else {
      showLogin();
      onLogout?.();
    }
  });

  if (!firebaseReady) {
    setAuthMessage("Configure o Firebase em firebase-config.js para ativar login e sincronização.");
  }
}

export function setAuthMessage(message) {
  if (elements.syncStatus) elements.syncStatus.textContent = message;
  if (elements.loginHint) elements.loginHint.textContent = message;
}

async function signInWithGoogle() {
  try {
    if (isMobile()) {
      await signInWithRedirect(auth, provider);
      return;
    }
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
      await signInWithRedirect(auth, provider);
      return;
    }
    setAuthMessage("Erro de autenticação");
    throw error;
  }
}

function showUser(user) {
  elements.loginScreen.hidden = true;
  elements.appShell.hidden = false;
  elements.userPanel.hidden = false;
  elements.userPhoto.src = user.photoURL || "";
  elements.userPhoto.alt = user.displayName || "Usuária";
  elements.userName.textContent = user.displayName || "Usuária autenticada";
  elements.userEmail.textContent = user.email || "";
}

function showLogin() {
  elements.loginScreen.hidden = false;
  elements.appShell.hidden = true;
  elements.userPanel.hidden = true;
}

function isMobile() {
  return matchMedia("(max-width: 760px)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
