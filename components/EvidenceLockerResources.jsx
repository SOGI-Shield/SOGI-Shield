"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  ExternalLink, 
  PhoneCall, 
  CheckSquare, 
  Square, 
  AlertOctagon, 
  FileCheck,
  LifeBuoy
} from "lucide-react";

export default function EvidenceLockerResources({ trackingCode }) {
  const [checklist, setChecklist] = useState({
    codeSaved: false,
    historyCleared: false,
    evidenceBackedUp: false,
    signalConfigured: false,
  });

  const toggleCheck = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClearBrowserHistory = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("sogi_last_submit");
        window.sessionStorage.clear();
        alert("Session caches cleared. Please close this browser tab or switch to private browsing.");
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-iris/40 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between transition-all">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-iris via-mint to-coral"></div>

      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-iris/20 text-white border border-iris/40 rounded-2xl">
            <Lock size={24} className="text-mint drop-shadow-[0_0_8px_rgba(0,217,157,0.5)]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Evidence Locker & Safety Checklist</h3>
            <p className="text-sm text-slate-300">
              Personal self-defense protocols to protect your identity & records
            </p>
          </div>
        </div>

        {/* Digital Safety Checklist */}
        <div className="space-y-3 mb-8">
          <div 
            onClick={() => toggleCheck("codeSaved")}
            className="flex items-start gap-3 p-3.5 bg-black/40 hover:bg-black/60 border border-white/5 rounded-2xl cursor-pointer transition-colors"
          >
            <button className="mt-0.5 text-slate-400 focus:outline-none">
              {checklist.codeSaved ? <CheckSquare size={20} className="text-mint" /> : <Square size={20} className="text-slate-500" />}
            </button>
            <div className="text-xs sm:text-sm">
              <strong className={`block ${checklist.codeSaved ? "text-mint line-through" : "text-white"}`}>
                Save Secret Tracking Code Offline
              </strong>
              <span className="text-slate-400">
                Write down <span className="font-mono text-mint font-bold">{trackingCode}</span> in a secure password manager or offline safe. It cannot be recovered.
              </span>
            </div>
          </div>

          <div 
            onClick={() => toggleCheck("evidenceBackedUp")}
            className="flex items-start gap-3 p-3.5 bg-black/40 hover:bg-black/60 border border-white/5 rounded-2xl cursor-pointer transition-colors"
          >
            <button className="mt-0.5 text-slate-400 focus:outline-none">
              {checklist.evidenceBackedUp ? <CheckSquare size={20} className="text-mint" /> : <Square size={20} className="text-slate-500" />}
            </button>
            <div className="text-xs sm:text-sm">
              <strong className={`block ${checklist.evidenceBackedUp ? "text-mint line-through" : "text-white"}`}>
                Preserve Primary Evidence (Unedited)
              </strong>
              <span className="text-slate-400">
                Store uncompressed photos, doctor notes, or audio in VeraCrypt or an encrypted offline drive with original creation timestamps intact.
              </span>
            </div>
          </div>

          <div 
            onClick={() => toggleCheck("signalConfigured")}
            className="flex items-start gap-3 p-3.5 bg-black/40 hover:bg-black/60 border border-white/5 rounded-2xl cursor-pointer transition-colors"
          >
            <button className="mt-0.5 text-slate-400 focus:outline-none">
              {checklist.signalConfigured ? <CheckSquare size={20} className="text-mint" /> : <Square size={20} className="text-slate-500" />}
            </button>
            <div className="text-xs sm:text-sm">
              <strong className={`block ${checklist.signalConfigured ? "text-mint line-through" : "text-white"}`}>
                Communicate via Disappearing Messages
              </strong>
              <span className="text-slate-400">
                If reaching out to human rights lawyers, use Signal with disappearing messages enabled or encrypted Proton/Tuta mail.
              </span>
            </div>
          </div>

          <div 
            onClick={() => toggleCheck("historyCleared")}
            className="flex items-start gap-3 p-3.5 bg-black/40 hover:bg-black/60 border border-white/5 rounded-2xl cursor-pointer transition-colors"
          >
            <button className="mt-0.5 text-slate-400 focus:outline-none">
              {checklist.historyCleared ? <CheckSquare size={20} className="text-mint" /> : <Square size={20} className="text-slate-500" />}
            </button>
            <div className="text-xs sm:text-sm flex-1">
              <strong className={`block ${checklist.historyCleared ? "text-mint line-through" : "text-white"}`}>
                Sanitize Browser Footprint
              </strong>
              <span className="text-slate-400 block mb-2">
                Clear browser tab history and cached data before handing your device to anyone.
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearBrowserHistory();
                }}
                className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 text-slate-200 px-3 py-1.5 rounded-lg border border-white/10 font-bold transition-colors cursor-pointer"
              >
                Clear SOGI Session Storage
              </button>
            </div>
          </div>
        </div>

        {/* Rapid Crisis & Legal Resources */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <LifeBuoy size={18} className="text-mint" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Emergency Hotlines & Human Rights Legal Aid
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://www.frontlinedefenders.org/emergency-contact"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl transition-all flex items-center justify-between group"
            >
              <div>
                <span className="block text-xs font-bold text-white group-hover:text-mint transition-colors">
                  Front Line Defenders 24/7
                </span>
                <span className="text-[11px] text-slate-400">+353 1 212 3750 (Emergency)</span>
              </div>
              <ExternalLink size={14} className="text-slate-500 group-hover:text-mint" />
            </a>

            <a
              href="https://outrightinternational.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl transition-all flex items-center justify-between group"
            >
              <div>
                <span className="block text-xs font-bold text-white group-hover:text-coral transition-colors">
                  Outright International
                </span>
                <span className="text-[11px] text-slate-400">Emergency Support & Advocacy</span>
              </div>
              <ExternalLink size={14} className="text-slate-500 group-hover:text-coral" />
            </a>

            <a
              href="https://ilga.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl transition-all flex items-center justify-between group"
            >
              <div>
                <span className="block text-xs font-bold text-white group-hover:text-iris-400 transition-colors">
                  ILGA World Directory
                </span>
                <span className="text-[11px] text-slate-400">Global LGBTI Legal Aid Network</span>
              </div>
              <ExternalLink size={14} className="text-slate-500 group-hover:text-iris-400" />
            </a>

            <a
              href="https://sps.un.org/english/rights"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl transition-all flex items-center justify-between group"
            >
              <div>
                <span className="block text-xs font-bold text-white group-hover:text-mint transition-colors">
                  UN OHCHR Portal
                </span>
                <span className="text-[11px] text-slate-400">Direct Special Procedures Filing</span>
              </div>
              <ExternalLink size={14} className="text-slate-500 group-hover:text-mint" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
