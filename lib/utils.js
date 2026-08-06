/**
 * Strips metadata from a text payload.
 * In a real scenario, this might involve complex regex to remove names, IP patterns, etc.
 * Here we ensure we only return the specific fields we want to send to Firestore.
 */
export function sanitizeReportPayload(payload) {
  return {
    id: crypto.randomUUID(), // client-side ID generation
    timestamp: new Date().toISOString(),
    country: payload.country?.trim() || "Unknown",
    region: payload.region?.trim() || "Unknown",
    category: payload.category?.trim() || "Uncategorized",
    summary: payload.summary?.trim() || "",
    evidenceLinks: Array.isArray(payload.evidenceLinks) ? payload.evidenceLinks : [],
    // Any extra fields are dropped.
  };
}

/**
 * Zero-touch automated classification engine.
 * IF evidenceLinks contains 1 or more valid URLs, status = 'PUBLIC_VERIFIED'.
 * IF no evidence links, status = 'HEATMAP_AGGREGATED'.
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
  
  if (validLinks.length > 0) {
    return {
      ...report,
      status: 'PUBLIC_VERIFIED',
      verificationScore: 1, // Simple score for having links
      evidenceLinks: validLinks // Keep only valid links
    };
  } else {
    return {
      ...report,
      status: 'HEATMAP_AGGREGATED',
      verificationScore: 0,
      evidenceLinks: [], // Ensure it's empty
      facilityName: null // Strip specific facility names to protect against liability
    };
  }
}
