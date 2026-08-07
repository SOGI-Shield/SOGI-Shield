/**
 * Generates a secure tracking code for users to follow up on their cases.
 */
export function generateTrackingCode() {
  const hash = crypto.randomUUID().split('-')[0].toUpperCase();
  const year = new Date().getFullYear();
  return `SOGI-${year}-${hash}`;
}

/**
 * Strips metadata from a text payload.
 */
export function sanitizeReportPayload(payload) {
  return {
    id: crypto.randomUUID(),
    trackingCode: generateTrackingCode(),
    timestamp: new Date().toISOString(),
    country: payload.country?.trim() || "Unknown",
    region: payload.region?.trim() || "Unknown",
    category: payload.category?.trim() || "Uncategorized",
    summary: payload.summary?.trim() || "",
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
      facilityName: null
    };
  }
}
