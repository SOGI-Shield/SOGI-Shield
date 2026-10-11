import { jsPDF } from "jspdf";
import { downloadFile, openInNewTab } from "./utils.js";

/**
 * Normalizes and sanitizes text for standard jsPDF fonts (WinAnsiEncoding / Latin-1).
 * Replaces smart quotes, curly apostrophes, em-dashes, and strips emoji/surrogate pairs
 * to prevent corrupted glyphs, replacement characters, or PDF rendering failures.
 *
 * @param {string} text - Input text
 * @returns {string} Sanitized string safe for jsPDF standard fonts
 */
export function cleanPdfText(text) {
  if (text == null) return "";
  let s = String(text);

  s = s
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "*")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\uFE00-\uFE0F]/g, ""); // Variation selectors

  // Strip emojis, surrogate pairs, and pictographic symbols outside standard Latin-1
  s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Extended_Pictographic}/gu, "");
  // Strip control characters except newline and tab
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return s;
}

/**
 * Generates an official, court- and NGO-ready UN/HRC Complaint Dossier PDF
 * completely client-side in the user's browser.
 * No data is transmitted to any server for this process.
 *
 * @param {Object} reportData - The incident report data
 * @param {Object} [options] - Options object
 * @param {'download'|'open'} [options.action='download'] - Whether to trigger file download or open in new tab
 * @returns {Promise<{doc: jsPDF, blob: Blob|null, filename: string}>}
 */
export async function generateComplaintPdf(reportData, options = {}) {
  if (!reportData) return null;

  const action = options.action || "download";

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const trackingCode = cleanPdfText(reportData.trackingCode || "SOGI-UNDISCLOSED");
  const rawTimestamp = reportData.timestamp;
  let timestamp = "";
  if (typeof rawTimestamp === "string") {
    timestamp = rawTimestamp;
  } else if (rawTimestamp && typeof rawTimestamp.toDate === "function") {
    timestamp = rawTimestamp.toDate().toISOString();
  } else if (rawTimestamp instanceof Date) {
    timestamp = rawTimestamp.toISOString();
  } else if (typeof rawTimestamp === "number") {
    timestamp = new Date(rawTimestamp).toISOString();
  } else {
    timestamp = new Date().toISOString();
  }

  let dateFormatted = "";
  try {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      dateFormatted = d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      dateFormatted = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  } catch {
    dateFormatted = timestamp.slice(0, 10) || new Date().toISOString().slice(0, 10);
  }
  dateFormatted = cleanPdfText(dateFormatted);

  // Pure geometry page break helper without modifying font or rendering headers mid-layout
  const checkPageBreak = (neededHeight = 8) => {
    if (y + neededHeight > pageHeight - 22) {
      doc.addPage();
      y = margin + 12; // Leave space for running header on subsequent pages
      return true;
    }
    return false;
  };

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("FORMAL HUMAN RIGHTS COMPLAINT DOSSIER", margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    "SUBMITTED UNDER UN OHCHR SPECIAL PROCEDURES & INDEPENDENT EXPERT ON SOGI MANDATE",
    margin,
    y
  );
  y += 6;

  // Horizontal Accent Bar
  doc.setDrawColor(99, 102, 241); // indigo-500
  doc.setLineWidth(1.2);
  doc.line(margin, y, margin + 40, y);
  doc.setDrawColor(244, 63, 94); // rose-500
  doc.line(margin + 40, y, margin + 70, y);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin + 70, y, pageWidth - margin, y);
  y += 8;

  // Pre-calculate Row 2 lines to dynamically scale the Metadata Box
  const geoDisplay = cleanPdfText(`${reportData.region || "Unspecified"}, ${reportData.country || "Unspecified"}`);
  const geoLines = doc.splitTextToSize(geoDisplay, 48);

  const catDisplay = cleanPdfText(reportData.category || "General Human Rights Violation");
  const catLines = doc.splitTextToSize(catDisplay, 52);

  const facilityDisplay = cleanPdfText(reportData.facilityName || "Withheld for Complainant Safety");
  const facLines = doc.splitTextToSize(facilityDisplay, 52);

  const maxLinesRow2 = Math.max(geoLines.length, catLines.length, facLines.length);
  const boxHeight = Math.max(36, 18 + maxLinesRow2 * 4.5 + 4);

  // Metadata Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

  const col1 = margin + 5;
  const col2 = margin + 58;
  const col3 = margin + 114;
  let metaY = y + 6;

  // Row 1
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Dossier Reference:", col1, metaY);
  doc.text("Filing Timestamp:", col2, metaY);
  doc.text("Grid Verification Status:", col3, metaY);

  metaY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(trackingCode, col1, metaY);
  doc.text(dateFormatted, col2, metaY);

  doc.setFont("helvetica", "bold");
  if (reportData.status === "PUBLIC_VERIFIED") {
    doc.setTextColor(220, 38, 38);
    doc.text("PUBLIC_VERIFIED (Level 1)", col3, metaY);
  } else if (reportData.status === "ACTION_IGNORED") {
    doc.setTextColor(100, 116, 139);
    doc.text("ACTION_IGNORED (Neglect Flagged)", col3, metaY);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text("HEATMAP_AGGREGATED (Protected)", col3, metaY);
  }

  // Row 2
  metaY += 7.5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Geographic Sector:", col1, metaY);
  doc.text("Violation Category:", col2, metaY);
  doc.text("Involved Facility / Entity:", col3, metaY);

  metaY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);

  doc.text(geoLines, col1, metaY);
  doc.text(catLines, col2, metaY);
  doc.text(facLines, col3, metaY);

  y += boxHeight + 6;

  // I. Addressed To Section
  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("I. ADDRESSED TO MANDATE HOLDERS & REVIEW BODIES", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const addresseeText = 
    "1. United Nations Independent Expert on protection against violence and discrimination based on sexual orientation and gender identity (IE SOGI) [OHCHR Special Procedures Branch]\n" +
    "2. Relevant National Human Rights Commission (NHRC) and State Statutory Human Rights Tribunals\n" +
    "3. Regional Human Rights Protection Mechanisms (Inter-American Commission on Human Rights / ECHR / ACHPR)";
  const addresseeLines = doc.splitTextToSize(cleanPdfText(addresseeText), contentWidth);
  for (let i = 0; i < addresseeLines.length; i++) {
    checkPageBreak(5);
    doc.text(addresseeLines[i], margin, y);
    y += 4.5;
  }
  y += 4;

  // II. Legal Framework Section
  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("II. INTERNATIONAL HUMAN RIGHTS LAW INSTRUMENTS APPLICABLE", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const legalText = 
    "This submission alleges breaches of peremptory human rights norms codified under:\n" +
    "- Universal Declaration of Human Rights (UDHR): Art. 1, 2 (Equality), Art. 3 (Right to Life, Liberty, and Security), Art. 5 (Freedom from Torture, Cruel, Inhuman, or Degrading Treatment), Art. 7 (Equality before Law), Art. 12 (Right to Privacy).\n" +
    "- International Covenant on Civil and Political Rights (ICCPR): Articles 2, 7, 9, 17, and 26.\n" +
    "- The Yogyakarta Principles & YP+10: Principle 1 (Universal Enjoyment), Principle 2 (Non-Discrimination), Principle 5 (Security of Person), Principle 10 (Freedom from Torture), and Principle 18 (Protection from Medical and Psychiatric Abuses).";
  const legalLines = doc.splitTextToSize(cleanPdfText(legalText), contentWidth);
  for (let i = 0; i < legalLines.length; i++) {
    checkPageBreak(5);
    doc.text(legalLines[i], margin, y);
    y += 4.2;
  }
  y += 4;

  // III. Factual Narrative Section
  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("III. FACTUAL STATEMENT OF INCIDENT (VERBATIM ACCOUNT)", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const summaryText = cleanPdfText(reportData.summary || "No detailed summary provided at the time of submission.");
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
  for (let i = 0; i < summaryLines.length; i++) {
    checkPageBreak(5);
    doc.text(summaryLines[i], margin, y);
    y += 4.5;
  }
  y += 4;

  // IV. Institutional Response / Negligence Section
  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("IV. EXHAUSTION OF DOMESTIC REMEDIES & INSTITUTIONAL RESPONSE", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  let authorityText = "";
  if (reportData.reportedToAuthorities) {
    const details = cleanPdfText(reportData.authorityDetails || "Reported to local law enforcement or regulatory board.");
    authorityText = `Formal report filed with domestic authorities: YES\nDetails: ${details}\n`;
    if (reportData.status === "ACTION_IGNORED" || reportData.actionIgnored) {
      authorityText += "EXPLICIT NEGLECT FLAGGED (ACTION_IGNORED): Domestic authorities have failed to launch an impartial inquiry, provide witness protection, or issue corrective orders despite notice of violations. Complainant invokes international communications mechanisms due to inadequacy or failure of domestic remedies.";
    } else {
      authorityText += "Status: Pending domestic investigation or resolution.";
    }
  } else {
    authorityText = "Formal report filed with domestic authorities: NO (Withheld due to credible fear of retaliatory detention, extortion, or institutional bias pursuant to UN Special Procedures Safety Guidelines).";
  }

  const authLines = doc.splitTextToSize(cleanPdfText(authorityText), contentWidth);
  for (let i = 0; i < authLines.length; i++) {
    checkPageBreak(5);
    doc.text(authLines[i], margin, y);
    y += 4.5;
  }
  y += 4;

  // V. Evidence Annex Section
  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("V. EVIDENCE ANNEX & DIGITAL INTEGRITY VERIFICATION", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  let evidenceText = "";
  if (Array.isArray(reportData.evidenceLinks) && reportData.evidenceLinks.length > 0) {
    const linksList = reportData.evidenceLinks
      .map((link, idx) => `  [${idx + 1}] ${cleanPdfText(String(link || "").trim())}`)
      .join("\n");
    evidenceText = "Public verifiable links and media attached to this filing:\n" + 
      linksList +
      "\n\nAdditional digital corroboration (device logs, audio recordings, or medical records) retained in victim's offline secure storage.";
  } else {
    evidenceText = "Direct public links withheld to prevent targeted harassment. Digital corroboration retained in victim's offline secure storage.";
  }

  const evidenceLines = doc.splitTextToSize(cleanPdfText(evidenceText), contentWidth);
  for (let i = 0; i < evidenceLines.length; i++) {
    checkPageBreak(5);
    doc.text(evidenceLines[i], margin, y);
    y += 4.5;
  }
  y += 4;

  // VI. Complainant Attestation & Signature Section
  checkPageBreak(50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("VI. COMPLAINANT ATTESTATION & SIGNATURE", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const attestationText = 
    "I hereby attest that the statements provided in this complaint are true and accurate to the best of my knowledge, information, and recollection. Due to grave security concerns, severe risk of societal retribution, or systemic persecution, this document is formally executed under SOGI Protective Zero-Knowledge Protocols.";
  const attLines = doc.splitTextToSize(cleanPdfText(attestationText), contentWidth);
  for (let i = 0; i < attLines.length; i++) {
    checkPageBreak(5);
    doc.text(attLines[i], margin, y);
    y += 4.2;
  }
  y += 6;

  // Signature Block
  checkPageBreak(30);
  const leftSigX = margin;
  const sigLineW = 70;
  const rightSigX = pageWidth - margin - sigLineW;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(leftSigX, y + 10, leftSigX + sigLineW, y + 10);
  doc.line(rightSigX, y + 10, rightSigX + sigLineW, y + 10);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text("Complainant / Authorized Signatory", leftSigX, y + 15);
  doc.text("Date & Jurisdiction of Execution", rightSigX, y + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("(Or: 'Signed Anonymously for Security')", leftSigX, y + 19);
  doc.text(`Recorded: ${dateFormatted}`, rightSigX, y + 19);

  // Headers and Footers across all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header (pages 2 and onward)
    if (i > 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 140, 155);
      doc.text(
        "CONFIDENTIAL LEGAL DOSSIER | SOGI-SHIELD ZERO-KNOWLEDGE PROTOCOL",
        margin,
        12
      );
      doc.text(`REF: ${trackingCode}`, pageWidth - margin, 12, { align: "right" });
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.3);
      doc.line(margin, 15, pageWidth - margin, 15);
    }

    // Running Footer (all pages)
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "CONFIDENTIAL & PRIVILEGED - Generated via SOGI-Shield Client-Side Engine - Zero-Knowledge Architecture",
      margin,
      pageHeight - 9
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 9, {
      align: "right",
    });
  }

  const safeFilename = `SOGI-Complaint-Dossier-${String(trackingCode).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  let blob = null;
  try {
    blob = doc.output("blob");
  } catch (blobErr) {
    console.warn("doc.output('blob') failed:", blobErr);
  }

  if (action === "open") {
    if (blob) {
      openInNewTab(blob, "application/pdf");
    } else {
      const dataUri = doc.output("datauristring");
      openInNewTab(dataUri, "application/pdf");
    }
  } else {
    // Default action: download
    try {
      if (blob) {
        downloadFile(blob, safeFilename, "application/pdf");
      } else {
        doc.save(safeFilename);
      }
    } catch (err) {
      console.warn("downloadFile failed, attempting doc.save fallback:", err);
      try {
        doc.save(safeFilename);
      } catch (saveErr) {
        console.error("doc.save failed:", saveErr);
      }
    }
  }

  return { doc, blob, filename: safeFilename };
}
