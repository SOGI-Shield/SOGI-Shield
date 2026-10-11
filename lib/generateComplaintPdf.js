import { jsPDF } from "jspdf";
import { downloadFile } from "./utils";

/**
 * Generates an official, court- and NGO-ready UN/HRC Complaint Dossier PDF
 * completely client-side in the user's browser.
 * No data is transmitted to any server for this process.
 *
 * @param {Object} reportData - The incident report data
 */
export async function generateComplaintPdf(reportData) {
  if (!reportData) return;

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

  const trackingCode = reportData.trackingCode || "SOGI-UNDISCLOSED";
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

  // Metadata Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);

  const col1 = margin + 5;
  const col2 = margin + 58;
  const col3 = margin + 112;
  let metaY = y + 7;

  // Row 1
  doc.text("Dossier Reference:", col1, metaY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(trackingCode, col1, metaY + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Filing Timestamp:", col2, metaY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const dateStr = dateFormatted.length > 25 ? dateFormatted.slice(0, 23) + "..." : dateFormatted;
  doc.text(dateStr, col2, metaY + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Grid Verification Status:", col3, metaY);
  doc.setFont("helvetica", "bold");
  if (reportData.status === "PUBLIC_VERIFIED") {
    doc.setTextColor(220, 38, 38);
    doc.text("PUBLIC_VERIFIED (Level 1)", col3, metaY + 5);
  } else if (reportData.status === "ACTION_IGNORED") {
    doc.setTextColor(100, 116, 139);
    doc.text("ACTION_IGNORED (Neglect Flagged)", col3, metaY + 5);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text("HEATMAP_AGGREGATED (Protected)", col3, metaY + 5);
  }

  // Row 2
  metaY += 13;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Geographic Sector:", col1, metaY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const geoDisplay = `${reportData.region || "Unspecified"}, ${reportData.country || "Unspecified"}`;
  doc.text(geoDisplay.length > 26 ? geoDisplay.slice(0, 24) + "..." : geoDisplay, col1, metaY + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Violation Category:", col2, metaY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const catDisplay = reportData.category || "Human Rights Violation";
  doc.text(catDisplay.length > 26 ? catDisplay.slice(0, 24) + "..." : catDisplay, col2, metaY + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Involved Facility/Entity:", col3, metaY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const facilityDisplay = reportData.facilityName || "Withheld for Complainant Safety";
  doc.text(facilityDisplay.length > 28 ? facilityDisplay.slice(0, 26) + "..." : facilityDisplay, col3, metaY + 5);

  y += 42;

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
  const addresseeLines = doc.splitTextToSize(addresseeText, contentWidth);
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
  const legalLines = doc.splitTextToSize(legalText, contentWidth);
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
  const summaryText = reportData.summary || "No detailed summary provided at the time of submission.";
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
    authorityText = `Formal report filed with domestic authorities: YES\nDetails: ${reportData.authorityDetails || "Reported to local law enforcement or regulatory board."}\n`;
    if (reportData.status === "ACTION_IGNORED" || reportData.actionIgnored) {
      authorityText += "EXPLICIT NEGLECT FLAGGED (ACTION_IGNORED): Domestic authorities have failed to launch an impartial inquiry, provide witness protection, or issue corrective orders despite notice of violations. Complainant invokes international communications mechanisms due to inadequacy or failure of domestic remedies.";
    } else {
      authorityText += "Status: Pending domestic investigation or resolution.";
    }
  } else {
    authorityText = "Formal report filed with domestic authorities: NO (Withheld due to credible fear of retaliatory detention, extortion, or institutional bias pursuant to UN Special Procedures Safety Guidelines).";
  }

  const authLines = doc.splitTextToSize(authorityText, contentWidth);
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
    evidenceText = "Public verifiable links and media attached to this filing:\n" + 
      reportData.evidenceLinks.map((link, idx) => `  [${idx + 1}] ${link}`).join("\n") +
      "\n\nAdditional digital corroboration (device logs, audio recordings, or medical records) retained in victim's offline secure storage.";
  } else {
    evidenceText = "Direct public links withheld to prevent targeted harassment. Digital corroboration retained in victim's offline secure storage.";
  }

  const evidenceLines = doc.splitTextToSize(evidenceText, contentWidth);
  for (let i = 0; i < evidenceLines.length; i++) {
    checkPageBreak(5);
    doc.text(evidenceLines[i], margin, y);
    y += 4.5;
  }
  y += 4;

  // VI. Complainant Attestation & Signature Section
  checkPageBreak(45);
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
  const attLines = doc.splitTextToSize(attestationText, contentWidth);
  for (let i = 0; i < attLines.length; i++) {
    checkPageBreak(5);
    doc.text(attLines[i], margin, y);
    y += 4.2;
  }
  y += 6;

  // Signature Block
  checkPageBreak(25);
  const sigBoxWidth = (contentWidth - 10) / 2;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 10, margin + sigBoxWidth, y + 10);
  doc.line(margin + sigBoxWidth + 10, y + 10, pageWidth - margin, y + 10);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text("Complainant / Designated Representative Signature", margin, y + 15);
  doc.text("Date & Jurisdiction of Execution", margin + sigBoxWidth + 10, y + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("(Or write: 'Signed Anonymously for Security')", margin, y + 19);
  doc.text(`Recorded: ${dateFormatted}`, margin + sigBoxWidth + 10, y + 19);

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

  // Trigger download with robust downloadFile helper ensuring correct filename & extension
  const safeFilename = `SOGI-Complaint-Dossier-${String(trackingCode).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  try {
    const blob = doc.output("blob");
    downloadFile(blob, safeFilename, "application/pdf");
  } catch (err) {
    console.warn("downloadFile failed, attempting doc.save fallback:", err);
    try {
      doc.save(safeFilename);
    } catch (saveErr) {
      console.error("doc.save failed:", saveErr);
    }
  }
}
