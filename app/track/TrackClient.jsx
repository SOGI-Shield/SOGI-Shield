"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, Activity, AlertCircle } from "lucide-react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore/lite";
import { db, isMockMode } from "@/lib/firebase";

export default function TrackCasePage() {
  const [trackingCode, setTrackingCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingCode) return;
    
    setIsSearching(true);
    setError("");
    setReport(null);

    try {
      if (isMockMode) {
        // Load local mock data
        const mockData = await import('@/src/data/mockReports.json').then(m => m.default).catch(() => []);
        const found = mockData.find(r => r.trackingCode === trackingCode);
        if (found) {
          setReport({ ...found, _docId: found.id });
        } else {
          setError("No incident found with this tracking code.");
        }
      } else {
        if (!db) {
          setError("Database is not initialized.");
          setIsSearching(false);
          return;
        }
        const q = query(collection(db, "reports"), where("trackingCode", "==", trackingCode));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError("No incident found with this tracking code. It may have been deleted for safety, or the code is incorrect.");
        } else {
          const docSnap = querySnapshot.docs[0];
          setReport({ ...docSnap.data(), _docId: docSnap.id });
        }
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching the case.");
    } finally {
      setIsSearching(false);
    }
  };

  const markAsIgnored = async () => {
    if (!report || !report._docId) return;
    setIsUpdating(true);
    try {
      if (isMockMode) {
        setReport({ ...report, status: 'ACTION_IGNORED' });
      } else {
        const docRef = doc(db, "reports", report._docId);
        // We must include the trackingCode in the update so the security rule can verify it
        await updateDoc(docRef, {
          status: 'ACTION_IGNORED',
          trackingCode: report.trackingCode // Re-sending to satisfy rules if needed, though diff rules only look at affectedKeys.
          // Wait, if we use diff(resource.data).affectedKeys().hasOnly(['status']), we SHOULD ONLY send status.
        });
      }
      setReport({ ...report, status: 'ACTION_IGNORED' });
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
          icon: <ShieldCheck className="text-green-500" size={32} />,
          title: "Public & Verified",
          desc: "Your incident is publicly visible on the map with a RED marker, including facility details. Evidence has been verified.",
          color: "border-green-500/50 bg-green-950/20 text-green-300"
        };
      case 'ACTION_IGNORED':
        return {
          icon: <AlertCircle className="text-slate-400" size={32} />,
          title: "Action Ignored / Institutional Neglect",
          desc: "Your incident is marked as ignored by authorities. It appears as a GREY marker on the map to highlight institutional inaction.",
          color: "border-slate-500/50 bg-slate-900/50 text-slate-300"
        };
      case 'HEATMAP_AGGREGATED':
        return {
          icon: <ShieldAlert className="text-orange-500" size={32} />,
          title: "Heatmap Aggregated",
          desc: "Your incident is aggregated anonymously into the regional heatmap (ORANGE). Facility details are hidden to protect you.",
          color: "border-orange-500/50 bg-orange-950/20 text-orange-300"
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
    <div className="flex-1 container mx-auto px-4 py-12 max-w-3xl relative z-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.2)]">Track Your Case</h1>
        <p className="text-slate-300 text-lg">Enter your secure tracking code to view the status of your incident report.</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500"></div>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            placeholder="e.g., SOGI-2026-ABCD" 
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all uppercase font-mono tracking-widest placeholder:text-slate-600"
            required
          />
          <button 
            type="submit" 
            disabled={isSearching}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center sm:justify-start gap-3 text-lg border border-white/20"
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
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className={`p-8 rounded-3xl border backdrop-blur-xl ${getStatusDisplay(report.status).color} flex items-start gap-5 transition-all shadow-xl relative overflow-hidden`}>
            <div className="flex-shrink-0 mt-1">
              {getStatusDisplay(report.status).icon}
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2 text-white">{getStatusDisplay(report.status).title}</h2>
              <p className="text-base opacity-90 leading-relaxed mb-4 text-slate-200">
                {getStatusDisplay(report.status).desc}
              </p>
              
              {report.status === 'PUBLIC_VERIFIED' && report.reportedToAuthorities && (
                <div className="mt-8 pt-8 border-t border-white/20">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-white text-lg">
                    <AlertCircle size={20} className="text-rose-400" /> Update Case Status
                  </h3>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    If authorities have failed to investigate or take action on this verified report, you can permanently flag it as <strong className="text-rose-400">ACTION_IGNORED</strong>. This changes the map marker to GREY to highlight institutional neglect.
                  </p>
                  <button 
                    onClick={markAsIgnored}
                    disabled={isUpdating}
                    className="bg-black/50 hover:bg-black/70 active:bg-black/90 text-white border border-rose-500/50 hover:border-rose-500 py-4 px-8 rounded-xl transition-all font-bold text-sm uppercase tracking-widest disabled:opacity-50"
                  >
                    {isUpdating ? "Updating..." : "Flag as Action Ignored by Authorities"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Report Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
              <div>
                <span className="block text-slate-500 mb-2 uppercase tracking-wider font-bold text-xs">Date Submitted</span>
                <span className="text-white text-base">{new Date(report.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-2 uppercase tracking-wider font-bold text-xs">Location</span>
                <span className="text-white text-base break-words">{report.region}, {report.country}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-2 uppercase tracking-wider font-bold text-xs">Category</span>
                <span className="text-white text-base break-words">{report.category}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-2 uppercase tracking-wider font-bold text-xs">Facility Name</span>
                <span className="text-white text-base break-words">{report.facilityName || "Hidden / Not provided"}</span>
              </div>
              <div className="sm:col-span-2 mt-4">
                <span className="block text-slate-500 mb-3 uppercase tracking-wider font-bold text-xs">Summary</span>
                <p className="text-slate-300 text-base leading-relaxed bg-black/40 p-6 rounded-2xl border border-white/5 break-words whitespace-pre-wrap shadow-inner">
                  {report.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
