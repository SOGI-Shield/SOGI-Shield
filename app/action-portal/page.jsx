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
    <div className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-4 text-pink-400">
          <FileText size={48} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">UN & Local HRC Action Portal</h1>
        <p className="text-slate-400 text-lg">
          Take your documentation a step further. Use our standardized legal complaint format to report incidents directly to human rights commissions and authorities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Info & Links */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg">
            <h3 className="font-bold text-lg mb-3 text-white">Direct Filing Links</h3>
            <p className="text-sm text-slate-400 mb-5">After customizing your complaint letter, submit it directly through these official portals:</p>
            
            <a href="https://hrcnet.nic.in/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 rounded-lg mb-3 transition-colors group">
              <span className="font-medium text-sm text-slate-200 group-hover:text-white">NHRC India Portal</span>
              <ExternalLink size={16} className="text-slate-400 group-hover:text-white" />
            </a>
            
            <a href="https://sps.un.org/english/rights" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 rounded-lg transition-colors group">
              <span className="font-medium text-sm text-slate-200 group-hover:text-white">UN Human Rights Submissions</span>
              <ExternalLink size={16} className="text-slate-400 group-hover:text-white" />
            </a>
          </div>

          <div className="bg-indigo-950/30 border border-indigo-500/30 p-6 rounded-xl shadow-lg">
            <h3 className="font-bold text-indigo-300 mb-3">Guidelines for Reporting</h3>
            <ul className="text-sm text-indigo-200/80 space-y-3 list-disc pl-4">
              <li><strong>Be factual:</strong> Stick strictly to the facts of what happened without emotional exaggeration.</li>
              <li><strong>Protect yourself:</strong> If you fear retaliation, you are fully entitled to submit the complaint anonymously or withhold your home address.</li>
              <li><strong>Secure channels:</strong> Do not send highly sensitive photo evidence through unencrypted email channels unless specifically requested via a secure link.</li>
            </ul>
          </div>
        </div>

        {/* Right Col: Letter Template */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
          <div className="bg-slate-950 border-b border-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Standard Complaint Template</h2>
              <p className="text-sm text-slate-400">Copy this format into your email client or Word processor.</p>
            </div>
            <button 
              onClick={copyToClipboard}
              className="bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-bold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 text-sm shrink-0 w-full sm:w-auto justify-center"
            >
              {copied ? <><CheckCircle2 size={18} /> Copied!</> : <><Copy size={18} /> Copy Template</>}
            </button>
          </div>
          
          <div className="p-6 sm:p-8 bg-slate-900 overflow-x-auto">
            <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
              {templateText}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
