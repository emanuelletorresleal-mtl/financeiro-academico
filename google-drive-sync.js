(function () {
  const API_BASE = "https://www.googleapis.com/drive/v3";
  const UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
  const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
  const config = window.FINANCEIRO_DRIVE_CONFIG || {};

  let tokenClient = null;
  let accessToken = "";
  let driveFileId = localStorage.getItem("financeiro-academico-drive-file-id") || "";
  let getState = null;
  let applyState = null;
  let statusHandler = null;
  let userHandler = null;
  let saveTimer = null;
  let isApplyingRemote = false;
  let lastSyncAt = localStorage.getItem("financeiro-academico-drive-last-sync") || "";
  let initAttempts = 0;

  function isConfigured() {
    return Boolean(config.clientId && !config.clientId.startsWith("SEU_"));
  }

  function init(options) {
    getState = options.getState;
    applyState = options.applyState;
    statusHandler = options.onStatus;
    userHandler = options.onUser;

    if (!isConfigured()) {
      setStatus("Google Drive não configurado");
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      initAttempts += 1;
      if (initAttempts < 20 && navigator.onLine) {
        setStatus("Carregando Google Drive");
        setTimeout(() => init(options), 500);
        return;
      }
      setStatus(navigator.onLine ? "Google Drive indisponível" : "Offline");
      return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: config.scope,
      callback: async (response) => {
        if (response.error) {
          setStatus("Erro");
          return;
        }
        accessToken = response.access_token;
        await afterLogin();
      },
    });

    setStatus(navigator.onLine ? "Modo local" : "Offline");
    window.addEventListener("online", () => {
      setStatus(accessToken ? "Conectado" : "Modo local");
      if (accessToken) syncNow();
    });
    window.addEventListener("offline", () => setStatus("Offline"));
  }

  function signIn() {
    if (!tokenClient) {
      setStatus("Google Drive não configurado");
      return;
    }
    tokenClient.requestAccessToken({ prompt: accessToken ? "" : "consent" });
  }

  function signOut() {
    if (accessToken && window.google?.accounts?.oauth2) {
      google.accounts.oauth2.revoke(accessToken, () => {});
    }
    accessToken = "";
    userHandler?.(null);
    setStatus(navigator.onLine ? "Modo local" : "Offline");
  }

  async function afterLogin() {
    setStatus("Conectado");
    await loadUserProfile();
    await syncOnLogin();
  }

  async function loadUserProfile() {
    try {
      const profile = await request(USERINFO_URL);
      userHandler?.({
        name: profile.name || "Conta Google",
        email: profile.email || "",
        photo: profile.picture || "",
      });
    } catch {
      userHandler?.({ name: "Conta Google", email: "", photo: "" });
    }
  }

  async function syncOnLogin() {
    if (!navigator.onLine) {
      setStatus("Offline");
      return;
    }
    setStatus("Sincronizando");
    const file = await findOrCreateFile();
    if (!file) return;
    const remotePayload = await downloadPayload(file.id);
    if (!remotePayload?.data) {
      await uploadState();
      return;
    }
    const remoteTime = Date.parse(remotePayload.updatedAt || 0);
    const localTime = Date.parse(localStorage.getItem("financeiro-academico-local-updated-at") || 0);
    if (remoteTime > localTime) {
      if (confirm("Existe um backup mais recente no Google Drive. Deseja restaurar esses dados neste dispositivo?")) {
        isApplyingRemote = true;
        applyState(remotePayload.data);
        isApplyingRemote = false;
        markSynced(remotePayload.updatedAt);
      }
    } else if (localTime > remoteTime) {
      if (confirm("Existem dados locais mais recentes. Deseja enviar estes dados para o Google Drive?")) {
        await uploadState();
      }
    } else {
      markSynced(remotePayload.updatedAt);
    }
    setStatus("Sincronizado");
  }

  async function syncNow() {
    if (!accessToken) {
      signIn();
      return;
    }
    if (!navigator.onLine) {
      setStatus("Offline");
      return;
    }
    setStatus("Sincronizando");
    try {
      await findOrCreateFile();
      await uploadState();
    } catch (error) {
      console.error(error);
      setStatus("Erro");
    }
  }

  async function restoreFromDrive() {
    if (!accessToken) {
      signIn();
      return;
    }
    if (!confirm("Restaurar o backup do Google Drive e substituir os dados locais deste dispositivo?")) return;
    setStatus("Sincronizando");
    try {
      const file = await findOrCreateFile();
      const payload = await downloadPayload(file.id);
      if (!payload?.data) {
        alert("Nenhum backup válido foi encontrado no Google Drive.");
        setStatus("Conectado");
        return;
      }
      isApplyingRemote = true;
      applyState(payload.data);
      isApplyingRemote = false;
      markSynced(payload.updatedAt);
      setStatus("Sincronizado");
    } catch (error) {
      console.error(error);
      setStatus("Erro");
    }
  }

  function scheduleSave() {
    localStorage.setItem("financeiro-academico-local-updated-at", new Date().toISOString());
    if (isApplyingRemote || !accessToken) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(syncNow, 5000);
  }

  async function findOrCreateFile() {
    if (driveFileId) {
      try {
        const existing = await request(`${API_BASE}/files/${driveFileId}?fields=id,name,modifiedTime`);
        if (existing?.id) return existing;
      } catch {
        driveFileId = "";
      }
    }

    const query = encodeURIComponent(`name='${config.fileName}' and trashed=false`);
    const result = await request(`${API_BASE}/files?q=${query}&spaces=drive&fields=files(id,name,modifiedTime)&pageSize=10`);
    const file = result.files?.[0];
    if (file) {
      driveFileId = file.id;
      localStorage.setItem("financeiro-academico-drive-file-id", driveFileId);
      return file;
    }
    return createFile();
  }

  async function createFile() {
    const payload = makePayload();
    const response = await multipartRequest(`${UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,modifiedTime`, "POST", {
      name: config.fileName,
      mimeType: "application/json",
    }, payload);
    driveFileId = response.id;
    localStorage.setItem("financeiro-academico-drive-file-id", driveFileId);
    markSynced(payload.updatedAt);
    return response;
  }

  async function uploadState() {
    const file = await findOrCreateFile();
    const payload = makePayload();
    await multipartRequest(`${UPLOAD_BASE}/files/${file.id}?uploadType=multipart&fields=id,name,modifiedTime`, "PATCH", {
      name: config.fileName,
      mimeType: "application/json",
    }, payload);
    markSynced(payload.updatedAt);
    setStatus("Sincronizado");
  }

  async function downloadPayload(fileId) {
    return request(`${API_BASE}/files/${fileId}?alt=media`);
  }

  function makePayload() {
    return {
      updatedAt: new Date().toISOString(),
      data: getState(),
    };
  }

  async function multipartRequest(url, method, metadata, payload) {
    const boundary = `financeiro_${Date.now()}`;
    const body = [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify(metadata),
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify(payload),
      `--${boundary}--`,
    ].join("\r\n");
    return request(url, {
      method,
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers || {}),
      },
    });
    if (!response.ok) throw new Error(`Google Drive API ${response.status}`);
    return response.json();
  }

  function markSynced(timestamp) {
    lastSyncAt = timestamp || new Date().toISOString();
    localStorage.setItem("financeiro-academico-drive-last-sync", lastSyncAt);
    localStorage.setItem("financeiro-academico-local-updated-at", lastSyncAt);
  }

  function setStatus(status) {
    statusHandler?.({
      status,
      connected: Boolean(accessToken),
      lastSyncAt,
      configured: isConfigured(),
    });
  }

  window.GoogleDriveSync = {
    init,
    signIn,
    signOut,
    syncNow,
    restoreFromDrive,
    scheduleSave,
  };
})();
