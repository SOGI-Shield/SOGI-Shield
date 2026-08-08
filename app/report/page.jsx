"use client";

import { useState, useEffect } from "react";
import { Info, ShieldCheck, ShieldAlert, Copy } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
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
        const query = encodeURIComponent(`${finalReport.region}, ${finalReport.country}`);
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const geoData = await geoRes.json();
        
        if (geoData && geoData.length > 0) {
          finalReport.lat = parseFloat(geoData[0].lat);
          finalReport.lng = parseFloat(geoData[0].lon);
        } else {
          throw new Error("Geocoding failed to find location");
        }
      } catch (err) {
        console.warn("Geocoding failed, falling back to dummy coordinates", err);
        finalReport.lat = 20 + (Math.random() * 40 - 20);
        finalReport.lng = 0 + (Math.random() * 40 - 20);
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
      <div className="flex-1 container mx-auto px-4 py-16 max-w-2xl text-center">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 shadow-2xl">
          <ShieldCheck className="text-green-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-white mb-2">Report Submitted Securely</h2>
          <p className="text-slate-400 mb-6">Your data has been processed via zero-touch classification.</p>
          
          <div className="bg-slate-950 border border-indigo-500/30 p-6 rounded-lg mb-6">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-2">Your Secret Tracking Code</h3>
            <div className="flex items-center justify-center gap-4">
              <span className="text-2xl font-mono text-white tracking-wider">{trackingCodeResult}</span>
              <button onClick={copyToClipboard} className="text-slate-400 hover:text-white transition-colors" title="Copy to clipboard">
                <Copy size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Save this code. It is the ONLY way to track your case status or update it to ACTION_IGNORED if authorities fail to act. We cannot recover it if lost.
            </p>
          </div>
          
          <button onClick={() => window.location.reload()} className="text-indigo-400 hover:text-indigo-300 font-medium">
            Submit another report (after 5 mins)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">File an Incident Report</h1>
        <p className="text-slate-400">Your privacy is our priority. No IP addresses or browser metadata are logged.</p>
      </div>

      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-6 mb-8 flex gap-4">
        <Info className="text-indigo-400 flex-shrink-0" size={24} />
        <div>
          <h3 className="font-bold text-indigo-300 mb-1">How Classification Works</h3>
          <p className="text-sm text-indigo-200/80 mb-2">
            Our Zero-Touch Automated Classification engine determines how your report is displayed:
          </p>
          <ul className="text-sm text-indigo-200/80 space-y-2">
            <li className="flex items-start gap-2">
              <ShieldCheck className="text-green-400 mt-0.5 flex-shrink-0" size={16} />
              <span><strong>PUBLIC_VERIFIED:</strong> If you attach valid evidence URLs, your report will be marked as verified and display facility details (RED marker).</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-500 mt-0.5 flex-shrink-0"></div>
              <span><strong>ACTION_IGNORED:</strong> If you attach evidence, report it to authorities, and explicitly flag it as ignored, it highlights institutional negligence (GREY marker).</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldAlert className="text-orange-400 mt-0.5 flex-shrink-0" size={16} />
              <span><strong>HEATMAP_AGGREGATED:</strong> If you submit without evidence links, your report remains unverified and anonymous (ORANGE zone).</span>
            </li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-xl shadow-xl">
        
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Country *</label>
            <input required name="country" maxLength={100} value={formData.country} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g., India" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">State / Region *</label>
            <input required name="region" maxLength={100} value={formData.region} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g., Maharashtra" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Facility / Practice Name (Optional)</label>
          <input name="facilityName" maxLength={200} value={formData.facilityName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Name of clinic, institution, or organization" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Misconduct Category *</label>
          <select required name="category" value={formData.category} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
            <option value="">Select a category...</option>
            <option value="Conversion Therapy / Unlicensed Counseling">Conversion Therapy / Unlicensed Counseling</option>
            <option value="Forced Confinement">Forced Confinement</option>
            <option value="Medical Misconduct / Refusal of Care">Medical Misconduct / Refusal of Care</option>
            <option value="State / Police Harassment">State / Police Harassment</option>
            <option value="Coercive Practice">Coercive Practice</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Experience Summary *</label>
          <textarea required name="summary" maxLength={5000} value={formData.summary} onChange={handleChange} rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Describe the incident objectively..."></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Public Evidence Links</label>
          <textarea name="evidenceLinks" maxLength={20000} value={formData.evidenceLinks} onChange={handleChange} rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://drive.google.com/..., https://news.example.com/...&#10;Separate multiple links with commas or new lines."></textarea>
        </div>

        <div className="border-t border-slate-800 pt-6 mt-6">
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input type="checkbox" name="reportedToAuthorities" checked={formData.reportedToAuthorities} onChange={handleChange} className="w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-600 bg-slate-950" />
            <span className="text-sm font-medium text-slate-200">I have reported this to official authorities (e.g., Police, State Medical Board, NHRC).</span>
          </label>
          
          {formData.reportedToAuthorities && (
            <div className="pl-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Authority Details</label>
                <input name="authorityDetails" maxLength={5000} value={formData.authorityDetails} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g., Filed complaint with State Medical Council on Oct 14" />
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="actionIgnored" checked={formData.actionIgnored} onChange={handleChange} className="w-5 h-5 mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-600 bg-slate-950" />
                <span className="text-sm font-medium text-slate-300">
                  <strong className="text-white">Flag as ACTION_IGNORED:</strong> Authorities have failed to launch an investigation or take action despite evidence. (This highlights institutional negligence on the map as a GREY marker).
                </span>
              </label>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || rateLimited}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Encrypting & Submitting..." : rateLimited ? "Rate Limited (Wait 5m)" : "Submit Incident Report"}
        </button>

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-900/40 border border-red-500/50 rounded-lg text-red-300 text-center font-medium">
            {errorMessage || "An error occurred while submitting. Please try again."}
          </div>
        )}

      </form>
    </div>
  );
}
