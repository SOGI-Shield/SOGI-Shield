"use client";

import { useState } from "react";
import { Info, ShieldCheck, ShieldAlert } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sanitizeReportPayload, classifyReport } from "@/lib/utils";

export default function ReportPage() {
  const [formData, setFormData] = useState({
    country: "",
    region: "",
    facilityName: "",
    category: "",
    summary: "",
    evidenceLinks: "", // Will be split by comma/newline
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // 1. Process evidence links
      const linksArray = formData.evidenceLinks
        .split(/[\n,]+/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

      // 2. Sanitize and prepare base payload
      const basePayload = sanitizeReportPayload({
        ...formData,
        evidenceLinks: linksArray
      });

      // 3. Run Zero-Touch Classification locally
      const finalReport = classifyReport(basePayload);

      // Add dummy lat/lng for map demo purposes based on country (In production this would use a geocoding API safely server-side or pre-computed)
      // Since it's client-side zero touch, we just randomize a bit for the demo if country is provided
      finalReport.lat = 20 + (Math.random() * 40 - 20);
      finalReport.lng = 0 + (Math.random() * 40 - 20);

      // 4. Submit to Firestore if API key is set
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here') {
        await addDoc(collection(db, "reports"), finalReport);
      } else {
        // Simulate network request if no Firebase
        console.log("Firebase not configured. Simulated submission:", finalReport);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setSubmitStatus('success');
      setFormData({ country: "", region: "", facilityName: "", category: "", summary: "", evidenceLinks: "" });
    } catch (error) {
      console.error("Error submitting report:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <span><strong>PUBLIC_VERIFIED:</strong> If you attach 1 or more valid public evidence URLs (news, public drives, court records), your report will be marked as verified and display specific facility details.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldAlert className="text-orange-400 mt-0.5 flex-shrink-0" size={16} />
              <span><strong>HEATMAP_AGGREGATED:</strong> If you submit without evidence links, your report remains unverified. Facility names are stripped to protect against defamation liability, and the report only increments regional incident counters on the map.</span>
            </li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-xl shadow-xl">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Country *</label>
            <input required name="country" value={formData.country} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g., India" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">State / Region *</label>
            <input required name="region" value={formData.region} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g., Maharashtra" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Facility / Practice Name (Optional)</label>
          <input name="facilityName" value={formData.facilityName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Name of clinic, institution, or organization" />
          <p className="text-xs text-slate-500 mt-1">This will only be displayed if evidence links are provided.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Misconduct Category *</label>
          <select required name="category" value={formData.category} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
            <option value="">Select a category...</option>
            <option value="Conversion Therapy / Unlicensed Counseling">Conversion Therapy / Unlicensed Counseling</option>
            <option value="Forced Confinement">Forced Confinement</option>
            <option value="Medical Misconduct / Refusal of Care">Medical Misconduct / Refusal of Care</option>
            <option value="State / Police Harassment">State / Police Harassment</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Experience Summary *</label>
          <textarea required name="summary" value={formData.summary} onChange={handleChange} rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Describe the incident objectively..."></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Public Evidence Links</label>
          <textarea name="evidenceLinks" value={formData.evidenceLinks} onChange={handleChange} rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://drive.google.com/..., https://news.example.com/...&#10;Separate multiple links with commas or new lines."></textarea>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Encrypting & Submitting..." : "Submit Incident Report"}
        </button>

        {submitStatus === 'success' && (
          <div className="p-4 bg-green-900/40 border border-green-500/50 rounded-lg text-green-300 text-center font-medium">
            Report successfully submitted and classified. Thank you for speaking out.
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="p-4 bg-red-900/40 border border-red-500/50 rounded-lg text-red-300 text-center font-medium">
            An error occurred while submitting. Please try again.
          </div>
        )}

      </form>
    </div>
  );
}
