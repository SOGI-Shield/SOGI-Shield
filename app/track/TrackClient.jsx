"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ShieldCheck, ShieldAlert, Activity, AlertCircle, FileText, Download, Share2, ExternalLink, MapPin } from "lucide-react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore/lite";
import { db, isMockMode } from "@/lib/firebase";
import { generateComplaintPdf } from "@/lib/generateComplaintPdf";
import { isValidWebUrl, sanitizeTrackingCode, buildSafeMapUrl } from "@/lib/utils";
import { decompressReport } from "@/lib/compress";

export default function TrackCasePage() {
  const [trackingCode, setTrackingCode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("code") || "";
    }
    return "";
  });
  const [isSearching, setIsSearching] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const executeSearch = useCallback(async (codeToSearch) => {
    const code = (codeToSearch || trackingCode || "").trim();
    if (!code) return;
    
    setIsSearching(true);
    setError(null);
    setReport(null);
    
    try {
      // 1. Check local dev store first (makes newly submitted dev reports immediately available)
      const localFound = await getLocalReportByTrackingCode(code);
      if (localFound) {
        const fullReport = await decompressReport(localFound);
        setReport({ ...fullReport, _docId: fullReport.id, trackingCode: code });
        setIsSearching(false);
        return;
      }

      if (isMockMode) {
        const m = await import('@/src/data/mockReports.json');
        const mockData = m.default || m;
        const found = mockData.find(r => r.trackingCode === code);
        if (found) {
          const fullReport = await decompressReport(found);
          setReport({ ...fullReport, _docId: fullReport.id, trackingCode: code });
        } else {
          setError("No incident found with this tracking code.");
        }
      } else {
        const { getDoc, doc } = await import("firebase/firestore/lite");
        
        // 1. Fetch the secret document by tracking code (Document ID)
        const secretRef = doc(db, "report_secrets", code);
        const secretSnap = await getDoc(secretRef);
        
        if (!secretSnap.exists()) {
          setError("No incident found with this tracking code.");
          setIsSearching(false);
          return;
        }
        
        const reportId = secretSnap.data().reportId;
        
        // 2. Fetch the actual report
        const reportRef = doc(db, "reports", reportId);
        const reportSnap = await getDoc(reportRef);
        
        if (!reportSnap.exists()) {
          setError("Report data missing.");
          setIsSearching(false);
          return;
        }
        
        const rawData = reportSnap.data();
        const fullReport = await decompressReport(rawData);
        setReport({ ...fullReport, _docId: reportId, trackingCode: code });
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching the case.");
    } finally {
      setIsSearching(false);
    }
  }, [trackingCode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        queueMicrotask(() => {
          executeSearch(code);
        });
      }
    }
  }, [executeSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(trackingCode);
  };

  const handleDownloadPdf = async () => {
    if (!report) return;
    setIsDownloadingPdf(true);
    try {
      await generateComplaintPdf(report, { action: "download" });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (!report) return;
    setIsDownloadingPdf(true);
    try {
      await generateComplaintPdf(report, { action: "open" });
    } catch (err) {
      console.error("PDF preview failed:", err);
      alert("Failed to preview PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const updateStatus = async (newStatus) => {
    if (!report || !report.trackingCode) return;
    setIsUpdating(true);
    try {
      await updateLocalReportStatus(report.trackingCode, newStatus);
      if (isMockMode) {
        setReport({ ...report, status: newStatus });
      } else {
        const res = await fetch('/api/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingCode: report.trackingCode, newStatus })
        });
        
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Update failed");
        }
      }
      setReport({ ...report, status: newStatus });
    } catch (err) {
      console.error(err);
      alert("Failed to update status. " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'PUBLIC_VERIFIED':
        return {
          icon: <ShieldCheck className="text-coral" size={32} />,
          title: "Public & Verified",
          desc: "Your incident is publicly visible on the map with a Coral Rose (#FB4E77) marker, including facility details. Evidence has been verified.",
          color: "border-coral/50 bg-coral/10 text-rose-200"
        };
      case 'ACTION_IGNORED':
        return {
          icon: <AlertCircle className="text-white" size={32} />,
          title: "Action Ignored / Institutional Neglect",
          desc: "Your incident is marked as ignored by authorities. It appears as an Electric Iris (#584BE0) marker on the map to highlight institutional inaction.",
          color: "border-iris/50 bg-iris/15 text-slate-200"
        };
      case 'HEATMAP_AGGREGATED':
        return {
          icon: <ShieldAlert className="text-mint" size={32} />,
          title: "Heatmap Aggregated",
          desc: "Your incident is aggregated anonymously into the regional heatmap (Vivid Mint #00D99D). Facility details are hidden to protect you.",
          color: "border-mint/50 bg-mint/10 text-emerald-200"
        };
      default:
        return {
          icon: <Activity size={32} />,
          title: "Unknown Status",
          desc: "The status of this case is unknown.",
          color: "border-slate-500 bg-slate-800 text-slate-300"
        };
    }
  };

  return (
    <div className="flex-1 container mx-auto px-4 py-8 sm:py-12 max-w-3xl relative z-10">
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 text-transparent bg-clip-text bg-linear-to-r from-coral via-iris to-mint drop-shadow-[0_0_20px_rgba(251,78,119,0.3)]">Track Your Case</h1>
        <p className="text-slate-300 text-base sm:text-lg">Enter your secure tracking code to view the status of your incident report.</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-8 sm:mb-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-coral via-iris to-mint"></div>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            placeholder="e.g., SOGI-2026-ABCD" 
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-3 sm:py-4 text-white focus:outline-none focus:border-iris focus:ring-1 focus:ring-iris transition-all uppercase font-mono tracking-widest placeholder:text-slate-600"
            required
          />
          <button 
            type="submit" 
            disabled={isSearching}
            className="bg-linear-to-r from-coral to-iris hover:opacity-95 text-white font-bold py-3 sm:py-4 px-8 sm:px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(251,78,119,0.4)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center sm:justify-start gap-3 text-base sm:text-lg border border-white/20 cursor-pointer active:scale-95"
          >
            <Search size={24} />
            {isSearching ? "Searching..." : "Lookup"}
          </button>
        </form>
        {error && (
          <div className="mt-6 p-5 bg-rose-900/40 border border-rose-500/50 text-rose-200 rounded-xl text-center font-bold shadow-lg">
            {error}
          </div>
        )}
      </div>

      {report && (
        <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl ${getStatusDisplay(report.status).color} flex items-start gap-4 sm:gap-5 transition-all shadow-xl relative overflow-hidden`}>
            <div className="shrink-0 mt-1">
              {getStatusDisplay(report.status).icon}
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2 text-white">{getStatusDisplay(report.status).title}</h2>
              <p className="text-base opacity-90 leading-relaxed mb-4 text-slate-200">
                {getStatusDisplay(report.status).desc}
              </p>
              
              <div className="mt-8 pt-8 border-t border-white/20">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-white text-lg">
                  <Activity size={20} className="text-mint" /> Change Case Status
                </h3>
                <p className="text-slate-300 leading-relaxed mb-4 text-sm">
                  You can update your report's visibility and status at any time. If you feel unsafe, you can downgrade to an anonymous heatmap point. If authorities ignored your case, flag it to highlight institutional neglect.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {report.status !== 'PUBLIC_VERIFIED' && report.evidenceLinks?.length > 0 && (
                    <button 
                      onClick={() => updateStatus('PUBLIC_VERIFIED')}
                      disabled={isUpdating}
                      className="flex-1 bg-black/40 hover:bg-coral/20 text-coral border border-coral/40 hover:border-coral/70 py-3 px-4 rounded-xl transition-all font-bold text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    >
                      Make Public & Verified
                    </button>
                  )}
                  {report.status !== 'HEATMAP_AGGREGATED' && (
                    <button 
                      onClick={() => updateStatus('HEATMAP_AGGREGATED')}
                      disabled={isUpdating}
                      className="flex-1 bg-black/40 hover:bg-mint/20 text-mint border border-mint/40 hover:border-mint/70 py-3 px-4 rounded-xl transition-all font-bold text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    >
                      Hide (Heatmap Only)
                    </button>
                  )}
                  {report.status !== 'ACTION_IGNORED' && report.reportedToAuthorities && (
                    <button 
                      onClick={() => updateStatus('ACTION_IGNORED')}
                      disabled={isUpdating}
                      className="flex-1 bg-black/40 hover:bg-iris/20 text-iris-400 hover:text-white border border-iris/40 hover:border-iris/70 py-3 px-4 rounded-xl transition-all font-bold text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    >
                      Flag as Ignored
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-lg">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 sm:mb-6">Report Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
              <div>
                <span className="block text-slate-500 mb-2 uppercase tracking-wider font-bold text-xs">Date Submitted</span>
                <span className="text-white text-base">{new Date(report.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-2 uppercase tracking-wider font-bold text-xs">Location</span>
                <span className="text-white text-base wrap-break-word">{report.region}, {report.country}</span>
                {report.plusCode && (
                  <span className="block text-xs font-mono text-mint mt-1">Plus Code: {report.plusCode}</span>
                )}
              </div>
              <div>
                <span className="block text-slate-500 mb-2 uppercase tracking-wider font-bold text-xs">Category</span>
                <span className="text-white text-base wrap-break-word">{report.category}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-2 uppercase tracking-wider font-bold text-xs">Facility Name</span>
                <span className="text-white text-base wrap-break-word">
                  {report.status === 'HEATMAP_AGGREGATED' ? "Hidden for safety" : (report.facilityName || "Hidden / Not provided")}
                </span>
              </div>
              <div className="sm:col-span-2 mt-4">
                <span className="block text-slate-500 mb-3 uppercase tracking-wider font-bold text-xs">Summary</span>
                <p className="text-slate-300 text-base leading-relaxed bg-black/40 p-4 sm:p-6 rounded-2xl border border-white/5 wrap-break-word whitespace-pre-wrap shadow-inner">
                  {report.summary}
                </p>
              </div>

              {report.evidenceLinks && report.evidenceLinks.length > 0 && (
                <div className="sm:col-span-2 mt-4">
                  <span className="block text-slate-500 mb-2 uppercase tracking-wider font-bold text-xs">Public Corroborating Evidence</span>
                  <ul className="space-y-1.5 bg-black/40 p-4 rounded-xl border border-white/5">
                    {report.evidenceLinks.map((link, idx) => {
                      const isSafe = isValidWebUrl(link);
                      return (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <ExternalLink size={14} className="text-mint shrink-0" />
                          {isSafe ? (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-mint hover:underline break-all">
                              {link}
                            </a>
                          ) : (
                            <span className="text-slate-400 break-all">{link}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Legal Recourse & Community Warning Actions */}
              <div className="sm:col-span-2 mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="flex-1 bg-linear-to-r from-coral via-iris to-mint hover:opacity-95 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(251,78,119,0.3)] flex items-center justify-center gap-2 text-sm border border-white/20 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <Download size={18} />
                  <span>{isDownloadingPdf ? "Building PDF..." : "Download Dossier PDF"}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePreviewPdf}
                  disabled={isDownloadingPdf}
                  className="bg-white/10 hover:bg-white/15 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-white/10 disabled:opacity-50 cursor-pointer"
                  title="Open and print PDF in browser"
                >
                  <ExternalLink size={18} className="text-mint" />
                  <span>Preview / Print</span>
                </button>
                <a
                  href={`/?lat=${report.lat || 20}&lng=${report.lng || 0}&zoom=11`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/15 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-white/10"
                >
                  <Share2 size={18} className="text-coral" />
                  <span>View Map</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
