/**
 * Generates a secure tracking code for users to follow up on their cases.
 */
export function generateTrackingCode() {
  const hash = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID().split("-")[0].toUpperCase()
    : Math.random().toString(36).substring(2, 10).toUpperCase();
  const year = new Date().getFullYear();
  return `SOGI-${year}-${hash}`;
}

/**
 * Strips metadata from a text payload.
 */
export function sanitizeReportPayload(payload) {
  const safeId = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;

  return {
    id: safeId,
    trackingCode: generateTrackingCode(),
    timestamp: new Date().toISOString(),
    country: payload.country?.trim() || "Unknown",
    region: payload.region?.trim() || "Unknown",
    category: payload.category?.trim() || "Uncategorized",
    summary: payload.summary?.trim() || "",
    facilityName: payload.facilityName?.trim() || null,
    evidenceLinks: Array.isArray(payload.evidenceLinks) ? payload.evidenceLinks : [],
    reportedToAuthorities: !!payload.reportedToAuthorities,
    authorityDetails: payload.authorityDetails?.trim() || "",
    _actionIgnored: !!payload.actionIgnored // Temporary flag used for classification
  };
}

/**
 * Zero-touch automated classification engine.
 */
export function classifyReport(report) {
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validLinks = report.evidenceLinks.filter(isValidUrl);
  const actionIgnored = report._actionIgnored;
  
  // Remove temporary flag before sending to Firestore
  const finalReport = { ...report };
  delete finalReport._actionIgnored;

  if (validLinks.length > 0) {
    if (finalReport.reportedToAuthorities && actionIgnored) {
      return {
        ...finalReport,
        status: 'ACTION_IGNORED',
        verificationScore: 1,
        evidenceLinks: validLinks
      };
    } else {
      return {
        ...finalReport,
        status: 'PUBLIC_VERIFIED',
        verificationScore: 1,
        evidenceLinks: validLinks
      };
    }
  } else {
    return {
      ...finalReport,
      status: 'HEATMAP_AGGREGATED',
      verificationScore: 0,
      evidenceLinks: [],
      facilityName: null // Always scrub facilityName for unverified heatmap data
    };
  }
}

/**
 * Triggers a robust client-side file download across all browsers (including Chrome on Windows)
 * by appending an anchor tag to document.body, setting explicit download filename, and cleaning up.
 * 
 * Prevents Chrome from saving blob URLs as anonymous UUIDs without file extensions.
 *
 * @param {Blob|string} data - Blob object or data: URL
 * @param {string} filename - Desired download filename with extension (e.g. dossier.pdf, card.png)
 * @param {string} mimeType - Optional MIME type fallback
 */
export function downloadFile(data, filename, mimeType = "application/octet-stream") {
  if (typeof window === "undefined" || !data) return;

  let blobUrl = "";
  let shouldRevoke = false;

  try {
    if (data instanceof Blob) {
      blobUrl = URL.createObjectURL(data);
      shouldRevoke = true;
    } else if (typeof data === "string" && data.startsWith("data:")) {
      try {
        const parts = data.split(",");
        const byteString = atob(parts[1]);
        const mime = (parts[0].split(":")[1] || "").split(";")[0] || mimeType;
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mime });
        blobUrl = URL.createObjectURL(blob);
        shouldRevoke = true;
      } catch {
        blobUrl = data;
      }
    } else if (typeof data === "string") {
      const blob = new Blob([data], { type: mimeType });
      blobUrl = URL.createObjectURL(blob);
      shouldRevoke = true;
    }

    const link = document.createElement("a");
    link.style.display = "none";
    link.href = blobUrl;
    link.download = filename;
    link.setAttribute("download", filename);

    // Explicitly add to document.body before clicking:
    // Required by Chrome to honor download filename and extension on blob/data URLs
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      if (shouldRevoke && blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    }, 2000);
  } catch (err) {
    console.error("downloadFile failed:", err);
  }
}
