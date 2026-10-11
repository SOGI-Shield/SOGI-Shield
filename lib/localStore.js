/**
 * Local development and mock store.
 * Allows full end-to-end testing of:
 * - Report submission
 * - Case tracking by trackingCode
 * - Status updates (PUBLIC_VERIFIED, ACTION_IGNORED, HEATMAP_AGGREGATED)
 * - Map cluster/marker updates
 * - Metrics counts
 * without requiring live Firestore credentials or network writes during local development.
 */

const STORAGE_KEY_REPORTS = "sogi_dev_reports";
const STORAGE_KEY_SECRETS = "sogi_dev_secrets";
const STORAGE_KEY_SECRETS_CRYPTO_KEY = "sogi_dev_secrets_key_v1";
const ENCRYPTION_PREFIX = "enc_v1:";

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getOrCreateSecretsKey() {
  const existing = localStorage.getItem(STORAGE_KEY_SECRETS_CRYPTO_KEY);
  if (existing) {
    return window.crypto.subtle.importKey(
      "raw",
      base64ToBytes(existing),
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  const keyBytes = window.crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(STORAGE_KEY_SECRETS_CRYPTO_KEY, bytesToBase64(keyBytes));
  return window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptSecretsObject(secrets) {
  const key = await getOrCreateSecretsKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(secrets));
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return `${ENCRYPTION_PREFIX}${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(ciphertext))}`;
}

async function readSecretsObject() {
  const rawSecrets = localStorage.getItem(STORAGE_KEY_SECRETS);
  if (!rawSecrets) return {};

  if (!rawSecrets.startsWith(ENCRYPTION_PREFIX)) {
    try {
      return JSON.parse(rawSecrets);
    } catch (err) {
      return {};
    }
  }

  const payload = rawSecrets.slice(ENCRYPTION_PREFIX.length);
  const [ivB64, dataB64] = payload.split(":");
  if (!ivB64 || !dataB64) return {};

  const key = await getOrCreateSecretsKey();
  const plaintext = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivB64) },
    key,
    base64ToBytes(dataB64)
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export function getLocalReports() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read local dev reports:", err);
    return [];
  }
}

export async function saveLocalReport(report, trackingCode) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalReports();
    // Prepend new report
    const updated = [report, ...existing.filter((r) => r.id !== report.id)];
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updated));

    // Save secret tracking code mapping (encrypted at rest)
    const secrets = await readSecretsObject();
    secrets[trackingCode] = { reportId: report.id };
    const encrypted = await encryptSecretsObject(secrets);
    localStorage.setItem(STORAGE_KEY_SECRETS, encrypted);
  } catch (err) {
    console.error("Failed to save local dev report:", err);
  }
}

export async function getLocalReportByTrackingCode(trackingCode) {
  if (typeof window === "undefined" || !trackingCode) return null;
  try {
    const secrets = await readSecretsObject();
    const secret = secrets[trackingCode];

    const reports = getLocalReports();
    if (secret && secret.reportId) {
      const found = reports.find((r) => r.id === secret.reportId);
      if (found) return { ...found, trackingCode };
    }

    // Direct match fallback
    const direct = reports.find((r) => r.trackingCode === trackingCode);
    if (direct) return direct;

    return null;
  } catch (err) {
    console.error("Failed to retrieve local report by tracking code:", err);
    return null;
  }
}

export async function updateLocalReportStatus(trackingCode, newStatus) {
  if (typeof window === "undefined" || !trackingCode) return false;
  try {
    const report = await getLocalReportByTrackingCode(trackingCode);
    if (!report) return false;

    const reports = getLocalReports();
    const updated = reports.map((r) => {
      if (r.id === report.id) {
        return { ...r, status: newStatus };
      }
      return r;
    });

    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error("Failed to update local report status:", err);
    return false;
  }
}
