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
    plusCode: payload.plusCode?.trim() || null,
    evidenceLinks: Array.isArray(payload.evidenceLinks) ? payload.evidenceLinks : [],
    reportedToAuthorities: !!payload.reportedToAuthorities,
    authorityDetails: payload.authorityDetails?.trim() || "",
    _actionIgnored: !!payload.actionIgnored // Temporary flag used for classification
  };
}

/**
 * Safely validates that a URL string uses http: or https: protocol,
 * strictly preventing XSS vectors (such as javascript: or data: URIs).
 */
export function isValidWebUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalizes user-entered URLs by trimming and prepending https:// if protocol is omitted.
 * Returns normalized URL string if valid, or null if invalid or unsafe.
 */
export function normalizeWebUrl(url) {
  if (!url || typeof url !== "string") return null;
  let trimmed = url.trim();
  if (!trimmed) return null;

  // Reject non-http protocols (e.g., javascript:, data:, vbscript:, file:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return isValidWebUrl(trimmed) ? trimmed : null;
  }

  // If no protocol is present, prepend https://
  trimmed = `https://${trimmed}`;
  return isValidWebUrl(trimmed) ? trimmed : null;
}

/**
 * Zero-touch automated classification engine.
 */
export function classifyReport(report) {
  const validLinks = (report.evidenceLinks || []).filter(isValidWebUrl);
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
 * Direct data URLs are passed as href directly (preventing premature blob revocation and 0-byte corruption).
 * Blob URLs are maintained for 60 seconds so the browser background file stream completes writing to disk.
 *
 * @param {Blob|string} data - Blob object or data: URL
 * @param {string} filename - Desired download filename with extension (e.g. dossier.pdf, card.png)
 * @param {string} mimeType - Optional MIME type fallback
 */
export function downloadFile(data, filename, mimeType = "application/octet-stream") {
  if (typeof window === "undefined" || !data) return;

  try {
    const link = document.createElement("a");
    link.style.display = "none";
    link.download = filename;
    link.setAttribute("download", filename);

    let objectUrlToRevoke = null;

    if (typeof data === "string" && data.startsWith("data:")) {
      // Direct Data URL: Written to disk directly without blob lifecycle race conditions
      link.href = data;
    } else {
      let blob;
      if (data instanceof Blob) {
        blob = data;
      } else if (typeof data === "string") {
        blob = new Blob([data], { type: mimeType });
      }
      objectUrlToRevoke = URL.createObjectURL(blob);
      link.href = objectUrlToRevoke;
    }

    // Explicitly add to document.body before clicking:
    // Required by Chrome on Windows to honor download filename and extension
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1000);

    // Keep blob URL alive for 60 seconds so background disk write finishes completely
    if (objectUrlToRevoke) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(objectUrlToRevoke);
        } catch {}
      }, 60000);
    }
  } catch (err) {
    console.error("downloadFile failed:", err);
  }
}

/**
 * Opens a Blob or data URL in a new browser tab for immediate viewing/printing,
 * bypassing local OS shell/Photos app file association issues entirely.
 *
 * @param {Blob|string} data - Blob object or data: URL
 * @param {string} mimeType - MIME type for preview (e.g. application/pdf, image/png)
 */
export function openInNewTab(data, mimeType = "application/pdf") {
  if (typeof window === "undefined" || !data) return;

  try {
    let url = null;
    let shouldRevoke = false;

    if (typeof data === "string" && data.startsWith("data:")) {
      const parts = data.split(",");
      const mime = parts[0].split(":")[1].split(";")[0] || mimeType;
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mime });
      url = URL.createObjectURL(blob);
      shouldRevoke = true;
    } else if (data instanceof Blob) {
      url = URL.createObjectURL(data);
      shouldRevoke = true;
    } else if (typeof data === "string") {
      const blob = new Blob([data], { type: mimeType });
      url = URL.createObjectURL(blob);
      shouldRevoke = true;
    }

    if (url) {
      const newWin = window.open(url, "_blank");
      if (!newWin) {
        // Fallback if popup blocker intercepted
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 1000);
      }

      if (shouldRevoke) {
        // Keep object URL alive for 5 minutes so user can preview, zoom, or print
        setTimeout(() => {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }, 300000);
      }
    }
  } catch (err) {
    console.error("openInNewTab failed:", err);
  }
}

/**
 * Safely sanitizes and validates a tracking code string.
 * Ensures the code contains only uppercase alphanumeric characters and hyphens,
 * preventing DOM text injection or path traversal vectors.
 *
 * @param {string} code - Raw tracking code from DOM/URL/input
 * @returns {string} Sanitized tracking code or empty string
 */
export function sanitizeTrackingCode(code) {
  if (!code || typeof code !== "string") return "";
  const cleaned = code.trim().toUpperCase();
  return /^[A-Z0-9-]{1,64}$/.test(cleaned) ? cleaned : "";
}

/**
 * Builds a safe, sanitized map URL with strictly validated numeric coordinates.
 * Prevents DOM text reinterpretation as HTML or arbitrary protocol injection (CodeQL js/xss-through-dom).
 *
 * @param {number|string} lat - Latitude
 * @param {number|string} lng - Longitude
 * @param {number|string} zoom - Map zoom level
 * @param {string} origin - Optional base origin (e.g. window.location.origin)
 * @returns {string} Sanitized URL
 */
export function buildSafeMapUrl(lat, lng, zoom = 11, origin = "") {
  const parsedLat = typeof lat === "number" ? lat : parseFloat(lat);
  const parsedLng = typeof lng === "number" ? lng : parseFloat(lng);
  const parsedZoom = typeof zoom === "number" ? zoom : parseInt(zoom, 10);

  const safeLat = Number.isFinite(parsedLat) && parsedLat >= -90 && parsedLat <= 90 ? parsedLat : 20;
  const safeLng = Number.isFinite(parsedLng) && parsedLng >= -180 && parsedLng <= 180 ? parsedLng : 0;
  const safeZoom = Number.isFinite(parsedZoom) && parsedZoom >= 1 && parsedZoom <= 18 ? parsedZoom : 11;

  const base = origin ? origin.replace(/\/+$/, "") : "";
  return `${base}/?lat=${encodeURIComponent(String(safeLat))}&lng=${encodeURIComponent(String(safeLng))}&zoom=${encodeURIComponent(String(safeZoom))}`;
}

export { encodePlusCode, decodePlusCode, isValidPlusCode } from "./pluscode";


