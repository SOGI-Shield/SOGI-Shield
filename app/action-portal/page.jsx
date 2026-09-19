"use client";

import { useState } from "react";
import { Copy, ExternalLink, FileText, CheckCircle2 } from "lucide-react";

export default function ActionPortalPage() {
  const [copied, setCopied] = useState(false);

  const templateText = `[Your Name / Withheld for Safety]
[Your Contact Information / Secure Email]
[Date]

To: [National Human Rights Commission (NHRC) / UN Independent Expert on SOGI / Local Authority]
[Authority Address or Email]

SUBJECT: URGENT COMPLAINT REGARDING HUMAN RIGHTS VIOLATION

Dear Sir/Madam,

I am writing to formally submit a complaint regarding a severe human rights violation that occurred on [Date of Incident] at [Location of Incident, including City and State].

INCIDENT DESCRIPTION:
[Describe the events clearly and chronologically. Provide specific details about what happened. Include the names or badge numbers of any authorities involved, if known and safe to disclose. Mention any witnesses or evidence you possess, but do not attach sensitive evidence if the channel is unsecure.]

RIGHTS VIOLATED:
This incident constitutes a direct violation of fundamental human rights, specifically [mention rights if known, e.g., the right to life, liberty, and security of person, protection against arbitrary arrest, or protection from torture and cruel, inhuman, or degrading treatment].

DEMANDS FOR ACTION:
I respectfully urge this honorable commission to:
1. Register this complaint officially.
2. Initiate an immediate, impartial investigation into this matter.
3. [Add any specific demands, e.g., Take disciplinary action against the officers involved / Provide protection to the victims].

Thank you for your prompt attention to this urgent matter.

Sincerely,

[Your Signature / "Signed Anonymously for Security"]`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(templateText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 container mx-auto px-4 py-12 max-w-5xl relative z-10">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 rounded-2xl shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <FileText size={48} className="text-pink-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">Global Human Rights Action Portal</h1>
        <p className="text-slate-300 text-lg leading-relaxed">
          Take your documentation a step further. Use our standardized legal complaint format to report incidents directly to international human rights commissions and local authorities worldwide.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Info & Links */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <h3 className="font-bold text-lg mb-3 text-white uppercase tracking-widest text-sm">Direct Filing & Directories</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">After customizing your complaint letter, use these global directories and portals to submit it:</p>
            
            <a href="https://sps.un.org/english/rights" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-black/40 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-2xl mb-4 transition-all group">
              <span className="font-bold text-sm text-slate-200 group-hover:text-cyan-400 transition-colors">UN Human Rights Submissions</span>
              <ExternalLink size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </a>
            
            <a href="https://ganhri.org/membership/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-black/40 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-2xl mb-4 transition-all group">
              <span className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">Global NHRI Directory</span>
              <ExternalLink size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </a>

            <a href="https://outrightinternational.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-black/40 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-2xl transition-all group">
              <span className="font-bold text-sm text-slate-200 group-hover:text-pink-400 transition-colors">Outright International</span>
              <ExternalLink size={16} className="text-slate-500 group-hover:text-pink-400 transition-colors" />
            </a>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-pink-500"></div>
            <h3 className="font-bold text-indigo-300 mb-4 uppercase tracking-widest text-sm">Guidelines for Reporting</h3>
            <ul className="text-sm text-slate-300 space-y-4 list-disc pl-4 marker:text-indigo-500 leading-relaxed">
              <li><strong className="text-white">Be factual:</strong> Stick strictly to the facts of what happened without emotional exaggeration.</li>
              <li><strong className="text-white">Protect yourself:</strong> If you fear retaliation, you are fully entitled to submit the complaint anonymously or withhold your home address.</li>
              <li><strong className="text-white">Secure channels:</strong> Do not send highly sensitive photo evidence through unencrypted email channels unless specifically requested via a secure link.</li>
            </ul>
          </div>
        </div>

        {/* Right Col: Letter Template */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative">
          <div className="bg-black/40 border-b border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Standard Complaint Template</h2>
              <p className="text-sm text-slate-400">Copy this format into your email client or Word processor.</p>
            </div>
            <button 
              onClick={copyToClipboard}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 active:from-pink-700 active:to-rose-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 text-sm shrink-0 w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] border border-rose-400/30 uppercase tracking-wider"
            >
              {copied ? <><CheckCircle2 size={18} /> Copied!</> : <><Copy size={18} /> Copy Template</>}
            </button>
          </div>
          
          <div className="p-6 sm:p-8 bg-transparent overflow-x-auto relative z-10">
            <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-black/40 p-6 rounded-2xl border border-white/5 shadow-inner selection:bg-pink-500/30">
              {templateText}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
