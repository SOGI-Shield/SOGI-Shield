import { jsPDF } from "jspdf";

/**
 * Generates an official, court- and NGO-ready UN/HRC Complaint Dossier PDF
 * completely client-side in the user's browser.
 * No data is transmitted to any server for this process.
 *
 * @param {Object} reportData - The incident report data
 */
export async function generateComplaintPdf(reportData) {
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
    dateFormatted = new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    dateFormatted = timestamp.slice(0, 10);
  }

  // Helper to check page break
  const checkPageBreak = (neededHeight = 10) => {
    if (y + neededHeight > pageHeight - 25) {
      doc.addPage();
      y = margin + 10;
      renderRunningHeader();
    }
  };

  const renderRunningHeader = () => {
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
  const col2 = margin + 55;
  const col3 = margin + 105;
  let metaY = y + 7;

  doc.text("Dossier Reference:", col1, metaY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(trackingCode, col1, metaY + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Filing Timestamp:", col2, metaY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`${dateFormatted} (ISO: ${timestamp.slice(0, 10)})`, col2, metaY + 5);

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

  metaY += 13;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Geographic Sector:", col1, metaY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`${reportData.region || "Unspecified"}, ${reportData.country || "Unspecified"}`, col1, metaY + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Violation Category:", col2, metaY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(reportData.category || "General Human Rights Violation", col2, metaY + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Involved Facility/Entity:", col3, metaY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const facilityDisplay = reportData.facilityName || "Withheld for Complainant Safety";
  doc.text(facilityDisplay.length > 28 ? facilityDisplay.slice(0, 26) + "..." : facilityDisplay, col3, metaY + 5);

  y += 42;

  // Addressed To Section
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
  doc.text(addresseeLines, margin, y);
  y += addresseeLines.length * 4.5 + 4;

  // Legal Framework Section
  checkPageBreak(30);
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
    "• Universal Declaration of Human Rights (UDHR): Art. 1, 2 (Equality), Art. 3 (Right to Life, Liberty, and Security), Art. 5 (Freedom from Torture, Cruel, Inhuman, or Degrading Treatment), Art. 7 (Equality before Law), Art. 12 (Right to Privacy).\n" +
    "• International Covenant on Civil and Political Rights (ICCPR): Articles 2, 7, 9, 17, and 26.\n" +
    "• The Yogyakarta Principles & YP+10: Principle 1 (Universal Enjoyment), Principle 2 (Non-Discrimination), Principle 5 (Security of Person), Principle 10 (Freedom from Torture), and Principle 18 (Protection from Medical and Psychiatric Abuses).";
  const legalLines = doc.splitTextToSize(legalText, contentWidth);
  doc.text(legalLines, margin, y);
  y += legalLines.length * 4.2 + 5;

  // Factual Narrative Section
  checkPageBreak(35);
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
    checkPageBreak(6);
    doc.text(summaryLines[i], margin, y);
    y += 4.5;
  }
  y += 4;

  // Institutional Response / Negligence Section
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
    checkPageBreak(6);
    doc.text(authLines[i], margin, y);
    y += 4.5;
  }
  y += 4;

  // Evidence Annex Section
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
    checkPageBreak(6);
    doc.text(evidenceLines[i], margin, y);
    y += 4.5;
  }
  y += 4;

  // Complainant Attestation & Empty Signature Section
  checkPageBreak(40);
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
  doc.text(attLines, margin, y);
  y += attLines.length * 4.2 + 8;

  // Signature Block
  const sigBoxWidth = (contentWidth - 10) / 2;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 14, margin + sigBoxWidth, y + 14);
  doc.line(margin + sigBoxWidth + 10, y + 14, pageWidth - margin, y + 14);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text("Complainant / Designated Representative Signature", margin, y + 19);
  doc.text("Date & Jurisdiction of Execution", margin + sigBoxWidth + 10, y + 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("(Or write: 'Signed Anonymously for Security')", margin, y + 23);
  doc.text(`Recorded: ${dateFormatted}`, margin + sigBoxWidth + 10, y + 23);

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "CONFIDENTIAL & PRIVILEGED • Generated via SOGI-Shield Client-Side Engine • Zero-Knowledge Architecture",
      margin,
      pageHeight - 9
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 9, {
      align: "right",
    });
  }

  // Trigger Save with robust blob fallback
  const safeFilename = `SOGI-Complaint-Dossier-${String(trackingCode).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  try {
    doc.save(safeFilename);
  } catch (err) {
    console.warn("doc.save failed, downloading via blob fallback:", err);
    if (typeof window !== "undefined") {
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  }
}
