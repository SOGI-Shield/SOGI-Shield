"use client";

import { useState, useEffect } from "react";
import { Info, ShieldCheck, ShieldAlert, Copy } from "lucide-react";
import { collection, addDoc } from "firebase/firestore/lite";
import { db, isMockMode } from "@/lib/firebase";
import { sanitizeReportPayload, classifyReport } from "@/lib/utils";
import { Turnstile } from '@marsidev/react-turnstile';

export default function ReportPage() {
  const [formData, setFormData] = useState({
    country: "",
    region: "",
    facilityName: "",
    category: "",
    summary: "",
    evidenceLinks: "",
    reportedToAuthorities: false,
    authorityDetails: "",
    actionIgnored: false,
    website_hp: "", // honeypot
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState("");
  const [trackingCodeResult, setTrackingCodeResult] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    // Check rate limit on load
    const lastSubmit = localStorage.getItem('sogi_last_submit');
    if (lastSubmit) {
      const timeSince = Date.now() - parseInt(lastSubmit, 10);
      if (timeSince < 5 * 60 * 1000) {
        setRateLimited(true);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingCodeResult);
    alert("Tracking code copied!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Honeypot check
    if (formData.website_hp) {
      console.warn("Honeypot triggered. Silently aborting.");
      setSubmitStatus('success'); // Fake success for bots
      return;
    }

    if (rateLimited) {
      setErrorMessage("Please wait 5 minutes between submissions.");
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    try {
      // Turnstile verification
      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
        if (!turnstileToken) {
          throw new Error("Bot verification incomplete. Please wait or reload.");
        }
        
        const tsRes = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken })
        });
        const tsData = await tsRes.json();
        if (!tsData.success) {
          throw new Error(tsData.message || "Failed anti-bot verification.");
        }
      }

      // Process evidence links
      const linksArray = formData.evidenceLinks
        .split(/[\n,]+/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

      // Sanitize and prepare base payload
      const basePayload = sanitizeReportPayload({
        ...formData,
        evidenceLinks: linksArray
      });

      // Run Zero-Touch Classification locally
      const finalReport = classifyReport(basePayload);

      // Fetch accurate coordinates via OpenStreetMap Nominatim
      try {
        let geoData = null;
        // Attempt 1: Region + Country
        const query1 = encodeURIComponent(`${finalReport.region}, ${finalReport.country}`);
        const res1 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query1}&limit=1`);
        geoData = await res1.json();
        
        // Attempt 2: If Region+Country fails (e.g. too specific/typos), fallback to Country only
        if (!geoData || geoData.length === 0) {
          const query2 = encodeURIComponent(`${finalReport.country}`);
          const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query2}&limit=1`);
          geoData = await res2.json();
        }
        
        if (geoData && geoData.length > 0) {
          finalReport.lat = parseFloat(geoData[0].lat);
          finalReport.lng = parseFloat(geoData[0].lon);
        } else {
          throw new Error("Could not find this location on the map. Please check your spelling for Region/Country.");
        }
      } catch (err) {
        console.error("Geocoding completely failed:", err);
        throw new Error(err.message || "Failed to locate the address. Please simplify the region/city name.");
      }

      // Submit to Firestore if API key is set and not mocking
      if (!isMockMode && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here') {
        await addDoc(collection(db, "reports"), finalReport);
      } else {
        // Simulate network request
        console.log("Mock submission:", finalReport);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update Rate Limit
      localStorage.setItem('sogi_last_submit', Date.now().toString());
      setRateLimited(true);

      setTrackingCodeResult(finalReport.trackingCode);
      setSubmitStatus('success');
      
      // Clear sensitive form data
      setFormData({ 
        country: "", region: "", facilityName: "", category: "", 
        summary: "", evidenceLinks: "", reportedToAuthorities: false, 
        authorityDetails: "", actionIgnored: false, website_hp: "" 
      });
      
    } catch (error) {
      console.error("Error submitting report:", error);
      setErrorMessage(error.message || "An error occurred while submitting.");
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success' && trackingCodeResult) {
    return (
      <div className="flex-1 container mx-auto px-4 py-16 max-w-2xl text-center relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <ShieldCheck className="text-emerald-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" size={64} />
          <h2 className="text-3xl font-bold text-white mb-3">Report Submitted Securely</h2>
          <p className="text-slate-300 mb-8 text-lg">Your data has been processed via zero-touch classification.</p>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl mb-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500"></div>
            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4">Your Secret Tracking Code</h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="text-xl sm:text-3xl font-mono text-white tracking-widest break-all font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{trackingCodeResult}</span>
              <button onClick={copyToClipboard} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 active:bg-white/20 p-3 rounded-xl transition-all shadow-lg" title="Copy to clipboard">
                <Copy size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-400 mt-6 leading-relaxed">
              Save this code. It is the ONLY way to track your case status or update it to ACTION_IGNORED if authorities fail to act. We cannot recover it if lost.
            </p>
          </div>
          
          <button onClick={() => window.location.reload()} className="text-indigo-400 hover:text-pink-400 active:text-pink-300 font-bold uppercase tracking-widest text-sm py-3 px-6 rounded-xl transition-colors">
            Submit another report (after 5 mins)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl relative z-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">File an Incident Report</h1>
        <p className="text-slate-300 text-lg">Your privacy is our priority. No IP addresses or browser metadata are logged.</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-8 mb-10 flex flex-col sm:flex-row gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-cyan-500 via-indigo-500 to-pink-500"></div>
        <Info className="text-indigo-400 flex-shrink-0 mt-1 drop-shadow-[0_0_10px_rgba(129,140,248,0.6)]" size={32} />
        <div>
          <h3 className="font-bold text-xl text-white mb-2">How Classification Works</h3>
          <p className="text-base text-slate-300 mb-4 leading-relaxed">
            Our Zero-Touch Automated Classification engine determines how your report is displayed:
          </p>
          <ul className="text-sm text-slate-300 space-y-4">
            <li className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <ShieldCheck className="text-rose-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" size={20} />
              <span className="leading-relaxed"><strong className="text-white">PUBLIC_VERIFIED:</strong> If you attach valid evidence URLs, your report will be marked as verified and display facility details (RED marker).</span>
            </li>
            <li className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="w-5 h-5 rounded-full bg-slate-500 mt-0.5 flex-shrink-0 shadow-[0_0_10px_rgba(100,116,139,0.5)]"></div>
              <span className="leading-relaxed"><strong className="text-white">ACTION_IGNORED:</strong> If you attach evidence, report it to authorities, and explicitly flag it as ignored, it highlights institutional negligence (GREY marker).</span>
            </li>
            <li className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <ShieldAlert className="text-emerald-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" size={20} />
              <span className="leading-relaxed"><strong className="text-white">HEATMAP_AGGREGATED:</strong> If you submit without evidence links, your report remains unverified and anonymous (EMERALD zone).</span>
            </li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        
        {/* Honeypot Field - visually hidden */}
        <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
          <input type="text" name="website_hp" tabIndex="-1" value={formData.website_hp} onChange={handleChange} autoComplete="off" />
        </div>

        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <Turnstile 
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
            onSuccess={(token) => setTurnstileToken(token)}
            options={{ action: 'submit_report', theme: 'dark' }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Country *</label>
            <input required name="country" maxLength={100} value={formData.country} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="e.g., India" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">State / Region *</label>
            <input required name="region" maxLength={100} value={formData.region} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="e.g., Maharashtra" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Facility / Practice Name (Optional)</label>
          <input name="facilityName" maxLength={200} value={formData.facilityName} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="Name of clinic, institution, or organization" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Misconduct Category *</label>
          <div className="relative">
            <select required name="category" value={formData.category} onChange={handleChange} style={{ colorScheme: 'dark' }} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer">
              <option value="">Select a category...</option>
              <option value="Conversion Therapy / Unlicensed Counseling">Conversion Therapy / Unlicensed Counseling</option>
              <option value="Forced Confinement">Forced Confinement</option>
              <option value="Medical Misconduct / Refusal of Care">Medical Misconduct / Refusal of Care</option>
              <option value="State / Police Harassment">State / Police Harassment</option>
              <option value="Coercive Practice">Coercive Practice</option>
              <option value="Other">Other</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Experience Summary *</label>
          <textarea required name="summary" maxLength={5000} value={formData.summary} onChange={handleChange} rows={5} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 leading-relaxed" placeholder="Describe the incident objectively..."></textarea>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Public Evidence Links</label>
          <textarea name="evidenceLinks" maxLength={20000} value={formData.evidenceLinks} onChange={handleChange} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 leading-relaxed" placeholder="https://drive.google.com/..., https://news.example.com/...&#10;Separate multiple links with commas or new lines."></textarea>
        </div>

        <div className="border-t border-white/10 pt-8 mt-8">
          <label className="flex items-start gap-4 mb-6 cursor-pointer group">
            <input type="checkbox" name="reportedToAuthorities" checked={formData.reportedToAuthorities} onChange={handleChange} className="mt-1 w-6 h-6 rounded-md border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-black/40 cursor-pointer" />
            <span className="text-base font-medium text-slate-300 group-hover:text-white transition-colors">I have reported this to official authorities (e.g., Police, State Medical Board, NHRC).</span>
          </label>
          
          {formData.reportedToAuthorities && (
            <div className="pl-10 space-y-6 animate-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Authority Details</label>
                <input name="authorityDetails" maxLength={5000} value={formData.authorityDetails} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="e.g., Filed complaint with State Medical Council on Oct 14" />
              </div>
              <label className="flex items-start gap-4 cursor-pointer group bg-white/5 p-5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <input type="checkbox" name="actionIgnored" checked={formData.actionIgnored} onChange={handleChange} className="mt-1 w-6 h-6 rounded-md border-slate-700 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-900 bg-black/40 cursor-pointer" />
                <span className="text-sm font-medium text-slate-300 leading-relaxed">
                  <strong className="text-rose-400 block mb-1 text-base">Flag as ACTION_IGNORED:</strong> 
                  Authorities have failed to launch an investigation or take action despite evidence. (This highlights institutional negligence on the map as a GREY marker).
                </span>
              </label>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || rateLimited}
          className="w-full mt-4 bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 hover:from-cyan-400 hover:via-indigo-400 hover:to-pink-400 text-white font-bold py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] disabled:opacity-50 disabled:shadow-none text-lg tracking-wide border border-white/20"
        >
          {isSubmitting ? "Encrypting & Submitting..." : rateLimited ? "Rate Limited (Wait 5m)" : "Submit Incident Report"}
        </button>

        {submitStatus === 'error' && (
          <div className="p-5 bg-rose-900/40 border border-rose-500/50 rounded-xl text-rose-200 text-center font-bold shadow-lg">
            {errorMessage || "An error occurred while submitting. Please try again."}
          </div>
        )}

      </form>
    </div>
  );
}
