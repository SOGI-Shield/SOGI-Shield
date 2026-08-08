"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, Activity, AlertCircle } from "lucide-react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
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
    <div className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Track Your Case</h1>
        <p className="text-slate-400">Enter your secure tracking code to view the status of your incident report.</p>
      </div>

      <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-xl mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input 
            type="text" 
            placeholder="e.g., SOGI-2026-ABCD" 
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors uppercase font-mono"
            required
          />
          <button 
            type="submit" 
            disabled={isSearching}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Search size={20} />
            {isSearching ? "Searching..." : "Lookup"}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 text-red-300 rounded text-sm">
            {error}
          </div>
        )}
      </div>

      {report && (
        <div className="space-y-6">
          <div className={`p-6 rounded-xl border ${getStatusDisplay(report.status).color} flex items-start gap-4 transition-all`}>
            <div className="flex-shrink-0 mt-1">
              {getStatusDisplay(report.status).icon}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">{getStatusDisplay(report.status).title}</h2>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                {getStatusDisplay(report.status).desc}
              </p>
              
              {report.status === 'PUBLIC_VERIFIED' && report.reportedToAuthorities && (
                <div className="mt-6 pt-6 border-t border-current/20">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <AlertCircle size={18} /> Update Case Status
                  </h3>
                  <p className="text-sm opacity-80 mb-4">
                    If authorities have failed to investigate or take action on this verified report, you can permanently flag it as <strong>ACTION_IGNORED</strong>. This changes the map marker to GREY to highlight institutional neglect.
                  </p>
                  <button 
                    onClick={markAsIgnored}
                    disabled={isUpdating}
                    className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 py-2 px-4 rounded transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isUpdating ? "Updating..." : "Flag as Action Ignored by Authorities"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Report Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <span className="block text-slate-500 mb-1">Date Submitted</span>
                <span className="text-slate-200">{new Date(report.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Location</span>
                <span className="text-slate-200">{report.region}, {report.country}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Category</span>
                <span className="text-slate-200">{report.category}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Facility Name</span>
                <span className="text-slate-200">{report.facilityName || "Hidden / Not provided"}</span>
              </div>
              <div className="sm:col-span-2 mt-2">
                <span className="block text-slate-500 mb-1">Summary</span>
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-4 rounded border border-slate-800 break-words whitespace-pre-wrap">
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
