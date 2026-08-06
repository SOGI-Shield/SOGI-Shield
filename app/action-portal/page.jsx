"use client";

import { useState } from "react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

export default function ActionPortalPage() {
  const [formData, setFormData] = useState({
    recipient: "NHRC_INDIA", // Default
    victimName: "",
    dateOfIncident: "",
    location: "",
    description: "",
    demands: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePDF = () => {
    // Zero server contact - generated purely in browser via jsPDF
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("FORMAL HUMAN RIGHTS COMPLAINT", pageWidth / 2, margin, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    let recipientText = "";
    if (formData.recipient === "NHRC_INDIA") {
      recipientText = "To: National Human Rights Commission (NHRC), India";
    } else if (formData.recipient === "UN_IE_SOGI") {
      recipientText = "To: UN Independent Expert on protection against violence and discrimination based on SOGI";
    } else {
      recipientText = "To: Local Human Rights Commission";
    }

    doc.text(recipientText, margin, margin + 20);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, margin + 30);

    doc.setFont("helvetica", "bold");
    doc.text("SUBJECT: Urgent complaint regarding human rights violation", margin, margin + 45);

    doc.setFont("helvetica", "normal");
    
    const bodyText = `
I am writing to formally submit a complaint regarding a severe human rights violation.

Victim/Complainant Name (Optional): ${formData.victimName || "Withheld for Safety"}
Date of Incident: ${formData.dateOfIncident || "Not specified"}
Location of Incident: ${formData.location || "Not specified"}

INCIDENT DESCRIPTION:
${formData.description}

DEMANDS / REQUEST FOR ACTION:
${formData.demands}

I respectfully urge this honorable commission/body to register this complaint and initiate an immediate, impartial investigation into this matter to ensure accountability and protection of fundamental human rights.
    `;

    const splitText = doc.splitTextToSize(bodyText, pageWidth - (margin * 2));
    doc.text(splitText, margin, margin + 60);

    doc.save("SOGI_Shield_Formal_Complaint.pdf");
  };

  return (
    <div className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-4 text-pink-400">
          <FileText size={48} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">UN & Local HRC Action Portal</h1>
        <p className="text-slate-400 text-lg">
          Take your documentation a step further. Use this tool to automatically format your experiences into formal legal complaint letters. 
          <strong className="text-slate-200"> All PDF generation happens locally on your device.</strong> Your personal details never touch our servers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Info & Links */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-3">Direct Filing Links</h3>
            <p className="text-sm text-slate-400 mb-4">After generating your PDF, submit it directly through the official portals below:</p>
            
            <a href="https://hrcnet.nic.in/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-700 border border-slate-600 rounded-lg mb-3 transition-colors">
              <span className="font-medium text-sm">NHRC India Portal</span>
              <ExternalLink size={16} className="text-slate-400" />
            </a>
            
            <a href="https://sps.un.org/english/rights" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors">
              <span className="font-medium text-sm">UN Human Rights Submissions</span>
              <ExternalLink size={16} className="text-slate-400" />
            </a>
          </div>

          <div className="bg-pink-950/30 border border-pink-500/30 p-6 rounded-xl">
            <h3 className="font-bold text-pink-300 mb-2">Safety Notice</h3>
            <p className="text-sm text-pink-200/80">
              Generating a complaint letter involves stating your personal details or detailed accounts. Please ensure you are on a private, secure device before downloading this PDF.
            </p>
          </div>
        </div>

        {/* Right Col: PDF Generator Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6 border-b border-slate-700 pb-4">Letter Generator</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Address Complaint To</label>
              <select name="recipient" value={formData.recipient} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500">
                <option value="NHRC_INDIA">National Human Rights Commission (NHRC), India</option>
                <option value="UN_IE_SOGI">UN Independent Expert on SOGI</option>
                <option value="OTHER">Other Local Authority</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name (Optional)</label>
                <input name="victimName" value={formData.victimName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500" placeholder="Leave blank to remain anonymous" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date of Incident</label>
                <input name="dateOfIncident" value={formData.dateOfIncident} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500" placeholder="e.g., October 12, 2023" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Location of Incident</label>
              <input name="location" value={formData.location} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500" placeholder="City, State, Facility Name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Detailed Description of Violation</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={6} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500" placeholder="Describe the events chronologically. Mention any authorities involved..."></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Demands for Action</label>
              <textarea name="demands" value={formData.demands} onChange={handleChange} rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500" placeholder="e.g., I request an immediate investigation into..."></textarea>
            </div>

            <button 
              onClick={generatePDF}
              className="w-full mt-6 bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Generate & Download PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
