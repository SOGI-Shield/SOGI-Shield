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

export function saveLocalReport(report, trackingCode) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalReports();
    // Prepend new report
    const updated = [report, ...existing.filter((r) => r.id !== report.id)];
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updated));

    // Save secret tracking code mapping
    const rawSecrets = localStorage.getItem(STORAGE_KEY_SECRETS);
    const secrets = rawSecrets ? JSON.parse(rawSecrets) : {};
    secrets[trackingCode] = { reportId: report.id };
    localStorage.setItem(STORAGE_KEY_SECRETS, JSON.stringify(secrets));
  } catch (err) {
    console.error("Failed to save local dev report:", err);
  }
}

export function getLocalReportByTrackingCode(trackingCode) {
  if (typeof window === "undefined" || !trackingCode) return null;
  try {
    const rawSecrets = localStorage.getItem(STORAGE_KEY_SECRETS);
    const secrets = rawSecrets ? JSON.parse(rawSecrets) : {};
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

export function updateLocalReportStatus(trackingCode, newStatus) {
  if (typeof window === "undefined" || !trackingCode) return false;
  try {
    const report = getLocalReportByTrackingCode(trackingCode);
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
