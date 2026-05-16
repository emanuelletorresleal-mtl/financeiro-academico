import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { db, firebaseReady } from "./firebase-config.js";

let userRef = null;
let unsubscribe = null;
let getState = null;
let applyState = null;
let statusCallback = null;
let saveTimer = null;
let applyingRemote = false;

// Inicia a sincronização do documento único users/{uid}/financeData/main.
export async function initCloudSync(user, options) {
  getState = options.getState;
  applyState = options.applyState;
  statusCallback = options.onStatus;

  if (!firebaseReady) {
    setSyncStatus("Firebase não configurado");
    return;
  }

  stopCloudSync();
  userRef = doc(db, "users", user.uid, "financeData", "main");
  setSyncStatus(navigator.onLine ? "Carregando nuvem..." : "Modo offline");

  const localState = getState();
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const cloudData = snapshot.data();
    const remoteState = fromCloudDocument(cloudData);
    if (localState && remoteState && fingerprint(localState) !== fingerprint(remoteState) && confirm("Encontramos dados locais neste navegador. Deseja importar esses dados para a nuvem e substituir a versão remota?")) {
      setSyncStatus("Importando dados locais...");
      await writeCloud(localState);
      setSyncStatus("Sincronizado");
    } else {
      applyRemote(cloudData);
    }
  } else if (localState) {
    setSyncStatus("Importando dados locais...");
    await writeCloud(localState);
    setSyncStatus("Sincronizado");
  }

  unsubscribe = onSnapshot(
    userRef,
    { includeMetadataChanges: true },
    (snapshotLive) => {
      if (!snapshotLive.exists()) return;
      setSyncStatus(snapshotLive.metadata.fromCache ? "Modo offline" : "Sincronizado");
      if (!snapshotLive.metadata.hasPendingWrites) applyRemote(snapshotLive.data());
    },
    (error) => {
      console.error(error);
      setSyncStatus("Erro de sincronização");
    }
  );
}

export function stopCloudSync() {
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  userRef = null;
}

export function scheduleCloudSave() {
  if (applyingRemote || !userRef || !getState) return;
  clearTimeout(saveTimer);
  setSyncStatus(navigator.onLine ? "Salvando..." : "Modo offline");
  saveTimer = setTimeout(async () => {
    try {
      await writeCloud(getState());
      setSyncStatus(navigator.onLine ? "Sincronizado" : "Modo offline");
    } catch (error) {
      console.error(error);
      setSyncStatus(navigator.onLine ? "Erro de sincronização" : "Modo offline");
    }
  }, 450);
}

export function setSyncStatus(message) {
  statusCallback?.(message);
}

async function writeCloud(state) {
  await setDoc(userRef, toCloudDocument(state), { merge: true });
}

function applyRemote(data) {
  const remoteState = fromCloudDocument(data);
  if (!remoteState) return;
  applyingRemote = true;
  applyState(remoteState);
  applyingRemote = false;
}

function toCloudDocument(state) {
  // Mantém appState para restauração fiel e campos espelhados para consultas futuras.
  return {
    appState: state,
    config: state.settings || {},
    settings: state.settings || {},
    categories: state.categories || [],
    subcategories: state.subcategories || [],
    paymentMethods: state.paymentMethods || [],
    banks: state.banks || [],
    cards: state.cards || [],
    accounts: state.accounts || [],
    revenues: state.incomes || [],
    debts: state.debts || [],
    installments: (state.debts || []).filter((item) => item.total),
    variableExpenses: state.expenses || [],
    goals: state.goals || [],
    ru: {
      transactions: state.ruTransactions || [],
      balance: (state.ruTransactions || []).reduce((total, item) => total + (item.type === "Recarga" ? Number(item.value) : -Number(item.value)), 0),
    },
    updatedAt: serverTimestamp(),
  };
}

function fromCloudDocument(data) {
  if (data.appState) return data.appState;
  return {
    settings: data.settings || data.config || {},
    categories: data.categories || [],
    subcategories: data.subcategories || [],
    paymentMethods: data.paymentMethods || [],
    banks: data.banks || [],
    cards: data.cards || [],
    accounts: data.accounts || [],
    incomes: data.revenues || [],
    debts: data.debts || [],
    expenses: data.variableExpenses || [],
    goals: data.goals || [],
    ruTransactions: data.ru?.transactions || [],
  };
}

function fingerprint(value) {
  return JSON.stringify(value, (key, item) => (key === "updatedAt" ? undefined : item));
}

window.addEventListener("online", () => setSyncStatus("Salvando..."));
window.addEventListener("offline", () => setSyncStatus("Modo offline"));
