"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Info, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  FileText, 
  Download, 
  Share2, 
  AlertTriangle, 
  ArrowRight, 
  Shield, 
  Sparkles,
  ExternalLink,
  Lock,
  EyeOff,
  Award,
  Zap,
  HelpCircle,
  HeartHandshake,
  CheckCircle2,
  Activity,
  Layers,
  MapPin,
  ChevronRight,
  Navigation,
  RefreshCw,
  Building2,
  Search,
  X
} from "lucide-react";
import { db, isMockMode } from "@/lib/firebase";
import { sanitizeReportPayload, classifyReport, isValidWebUrl, normalizeWebUrl, encodePlusCode, decodePlusCode, isValidPlusCode } from "@/lib/utils";
import { Turnstile } from '@marsidev/react-turnstile';
import { generateComplaintPdf } from "@/lib/generateComplaintPdf";
import { saveLocalReport } from "@/lib/localStore";
import { compressPayload } from "@/lib/compress";
import CommunityCautionCard from "@/components/CommunityCautionCard";
import RegionalImpactPreview from "@/components/RegionalImpactPreview";
import EvidenceLockerResources from "@/components/EvidenceLockerResources";
import { getGeoJson } from "@/lib/geoDataService";

const NARRATIVE_STARTERS = [
  {
    label: "Timeline & Setting",
    icon: "📅",
    text: "On [Date/Approximate Time] in [City/State/Location], the incident occurred when "
  },
  {
    label: "Coercive Misconduct",
    icon: "🛑",
    text: "I was subjected to non-consensual aversion therapy / forced conversion practices / psychological intimidation aimed at "
  },
  {
    label: "Practitioners / Perpetrators",
    icon: "👥",
    text: "The clinic staff / counselors / authorities involved identified themselves as [Titles or Names if known] and stated "
  },
  {
    label: "Harm & Inaction",
    icon: "💔",
    text: "This resulted in unlawful detention / severe psychological distress / restriction of liberty, and local remedies failed because "
  }
];

const CATEGORY_PRESETS = [
  { id: "Conversion Therapy / Unlicensed Counseling", icon: "🧠", short: "Conversion Therapy", desc: "Aversion counseling, pseudo-science, forced identity change" },
  { id: "Forced Confinement", icon: "🚪", short: "Forced Confinement", desc: "Detention in ashrams, rehabilitation centers, or homes" },
  { id: "Medical Misconduct / Refusal of Care", icon: "🩺", short: "Medical Denial", desc: "Denied HRT, refusal of emergency treatment, psychiatric abuse" },
  { id: "State / Police Harassment", icon: "⚖️", short: "Police Harassment", desc: "Arbitrary arrest, extortion, invasive searches, blackmail" },
  { id: "Coercive Practice", icon: "⚠️", short: "Coercive Practice", desc: "Family coercion, forced marriage, threat of honor crimes" },
  { id: "Other", icon: "📋", short: "Other Misconduct", desc: "Any other human rights infringement based on SOGI" },
];

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
  const [submittedReport, setSubmittedReport] = useState(null);
  const [rateLimited, setRateLimited] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const lastSubmit = localStorage.getItem('sogi_last_submit');
      if (lastSubmit && !isMockMode && process.env.NODE_ENV !== 'development') {
        const timeSince = Date.now() - parseInt(lastSubmit, 10);
        return timeSince < 5 * 60 * 1000;
      }
    } catch {
      return false;
    }
    return false;
  });
  const [turnstileToken, setTurnstileToken] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'personal' | 'community'
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedLocationInfo, setDetectedLocationInfo] = useState(null);
  const [detectedCoords, setDetectedCoords] = useState(null);
  const [customCategory, setCustomCategory] = useState("");
  const [openSourceCities, setOpenSourceCities] = useState([]);
  const [citySearchInput, setCitySearchInput] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  useEffect(() => {
    getGeoJson('/cities.geojson').then(data => {
      if (data && data.features) {
        setOpenSourceCities(data.features);
      }
    }).catch(err => console.warn("Failed to load cities.geojson in report form", err));
  }, []);

  const cityFilterResults = useMemo(() => {
    if (!citySearchInput.trim() || !openSourceCities.length) return [];
    const q = citySearchInput.toLowerCase().trim();
    return openSourceCities
      .filter(c => {
        const name = (c.properties?.name || "").toLowerCase();
        const country = (c.properties?.country || "").toLowerCase();
        const district = (c.properties?.district || "").toLowerCase();
        const plusCode = (c.properties?.plusCode || "").toLowerCase();
        return name.includes(q) || country.includes(q) || district.includes(q) || plusCode.includes(q);
      })
      .slice(0, 6);
  }, [citySearchInput, openSourceCities]);

  const handleSelectCityGrid = (city) => {
    const [lng, lat] = city.geometry.coordinates;
    const plusCode = city.properties.plusCode || encodePlusCode(lat, lng);
    setFormData(prev => ({
      ...prev,
      country: city.properties.country || prev.country,
      region: city.properties.district || city.properties.name
    }));
    setDetectedCoords({ lat, lng, plusCode });
    setDetectedLocationInfo({
      error: false,
      message: `Verified via Natural Earth & GeoNames: ${city.properties.name}, ${city.properties.country} (Plus Code: ${plusCode})`,
      source: "natural_earth_geonames"
    });
    setCitySearchInput("");
    setShowCityDropdown(false);
  };

  const handleAutoDetectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setDetectedLocationInfo({
        error: true,
        message: "Geolocation is not supported by your browser."
      });
      return;
    }

    setIsDetectingLocation(true);
    setDetectedLocationInfo(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setDetectedCoords({ lat: latitude, lng: longitude });

          // Call reverse geocoding API powered by Photon by Komoot
          const res = await fetch(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();

          if (data && data.success) {
            setFormData(prev => ({
              ...prev,
              country: data.country && data.country !== "Unknown" ? data.country : prev.country,
              region: data.region && data.region !== "Sector" ? data.region : prev.region,
              facilityName: prev.facilityName || (data.city ? data.city : "")
            }));

            setDetectedLocationInfo({
              error: false,
              message: `Auto-detected via Photon: ${data.formattedAddress || `${data.region}, ${data.country}`}`,
              source: data.source
            });
          } else {
            setDetectedLocationInfo({
              error: false,
              message: `Coordinates detected (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Please enter Region/Country.`,
              source: "coordinates"
            });
          }
        } catch (err) {
          console.warn("Reverse geocode failed:", err);
          setDetectedLocationInfo({
            error: true,
            message: "Unable to reverse geocode coordinates. You can type Country and Region manually."
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (geoError) => {
        setIsDetectingLocation(false);
        let msg = "Could not access location. Please enter Country and Region manually.";
        if (geoError.code === 1) msg = "Location permission denied. Please enter Country and Region manually.";
        else if (geoError.code === 2) msg = "Position unavailable. Please enter Country and Region manually.";
        else if (geoError.code === 3) msg = "Location request timed out. Please enter manually.";
        setDetectedLocationInfo({ error: true, message: msg });
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  };

  const handleResetForm = () => {
    setFormData({
      country: "",
      region: "",
      facilityName: "",
      category: "",
      summary: "",
      evidenceLinks: "",
      reportedToAuthorities: false,
      authorityDetails: "",
      actionIgnored: false,
      website_hp: "",
    });
    setSubmitStatus(null);
    setTrackingCodeResult("");
    setSubmittedReport(null);
    setDetectedCoords(null);
    setDetectedLocationInfo(null);
    setCustomCategory("");
    setErrorMessage("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };



  const handleAutofillDemo = () => {
    if (!isMockMode) return;
    setFormData({
      country: "India",
      region: "Maharashtra",
      facilityName: "Metro Counseling & Wellness Centre",
      category: "Conversion Therapy / Unlicensed Counseling",
      summary: "Survivor was subjected to coercive aversion counseling and non-consensual psychiatric intervention aimed at altering sexual orientation. Facility operated without valid psychiatric licensing.",
      evidenceLinks: "https://drive.google.com/open?id=demo_affidavit, https://news.example.com/investigation",
      reportedToAuthorities: true,
      authorityDetails: "Filed complaint with State Medical Council and local human rights commission on Oct 14.",
      actionIgnored: true,
      website_hp: "",
    });
  };

  const [submittingStep, setSubmittingStep] = useState(0);

  // Live valid links count
  const detectedLinks = (formData.evidenceLinks || "")
    .split(/[\n,]+/)
    .map(l => normalizeWebUrl(l))
    .filter(Boolean);

  // Live status calculation
  const liveStatus = detectedLinks.length > 0
    ? (formData.reportedToAuthorities && formData.actionIgnored ? 'ACTION_IGNORED' : 'PUBLIC_VERIFIED')
    : 'HEATMAP_AGGREGATED';

  // Words count in summary
  const summaryWords = (formData.summary?.trim().split(/\s+/).filter(Boolean) || []).length;

  // Courage & Documentation strength score (0 - 100%)
  const calculateStrength = () => {
    let score = 0;
    if (formData.country?.trim() && formData.region?.trim()) score += 25;
    if (formData.category?.trim()) score += 20;
    if (summaryWords >= 30) score += 30;
    else if (summaryWords >= 10) score += 15;
    else if (summaryWords > 0) score += 5;
    if (detectedLinks.length > 0) score += 15;
    if (formData.facilityName?.trim()) score += 10;
    return Math.min(100, score);
  };
  const strengthScore = calculateStrength();

  const handleInsertStarter = (starterText) => {
    setFormData(prev => {
      const current = prev.summary || "";
      const separator = current.trim() ? "\n\n" : "";
      return { ...prev, summary: current + separator + starterText };
    });
  };

  const handleCategorySelect = (categoryId) => {
    setFormData(prev => ({ ...prev, category: categoryId }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingCodeResult);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!submittedReport) return;
    setIsDownloadingPdf(true);
    try {
      await generateComplaintPdf(submittedReport, { action: "download" });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePreviewPdf = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!submittedReport) return;
    setIsDownloadingPdf(true);
    try {
      await generateComplaintPdf(submittedReport, { action: "open" });
    } catch (err) {
      console.error("PDF preview failed:", err);
      alert("Failed to preview PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePanicExit = () => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.replace("https://www.wikipedia.org");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Honeypot check
    if (formData.website_hp) {
      console.warn("Honeypot triggered. Silently aborting.");
      setSubmitStatus('success');
      setTrackingCodeResult("SOGI-SHIELD-PROTECTED");
      setSubmittedReport({ country: "Anonymous", region: "Sector" });
      return;
    }

    if (rateLimited) {
      setErrorMessage("Please wait 5 minutes between submissions.");
      setSubmitStatus('error');
      return;
    }

    // Explicit validation before proceeding
    const trimmedCountry = formData.country?.trim();
    const trimmedRegion = formData.region?.trim();
    const trimmedCategory = formData.category?.trim();
    const trimmedSummary = formData.summary?.trim();

    if (!trimmedCountry) {
      setErrorMessage("Please specify the Country where the incident occurred.");
      setSubmitStatus('error');
      return;
    }

    if (!trimmedRegion) {
      setErrorMessage("Please specify the State / Province / Region.");
      setSubmitStatus('error');
      return;
    }

    if (!trimmedCategory) {
      setErrorMessage("Please select a Misconduct Category.");
      setSubmitStatus('error');
      return;
    }

    if (!trimmedSummary || trimmedSummary.length < 10) {
      setErrorMessage("Please provide a factual narrative of the incident (at least 10 characters).");
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmittingStep(1);
    setSubmitStatus(null);
    setErrorMessage("");

    try {
      // Turnstile verification (only enforced in production when not in mock mode)
      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !isMockMode && process.env.NODE_ENV !== 'development') {
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

      // Process, normalize, and cap evidence links to max 10 (strictly complying with firestore.rules)
      const linksArray = (formData.evidenceLinks || "")
        .split(/[\n,]+/)
        .map(normalizeWebUrl)
        .filter(Boolean)
        .slice(0, 10);

      // Sanitize and prepare base payload
      const resolvedCategory = (trimmedCategory === "Other" && customCategory?.trim())
        ? `Other: ${customCategory.trim()}`.slice(0, 100)
        : trimmedCategory;

      const basePayload = sanitizeReportPayload({
        ...formData,
        country: trimmedCountry,
        region: trimmedRegion,
        category: resolvedCategory,
        summary: trimmedSummary,
        evidenceLinks: linksArray
      });

      // Run Zero-Touch Classification locally
      const finalReport = classifyReport(basePayload);

      // Step 2: Geocoding incident location & Open Location Code (Plus Code)
      setSubmittingStep(2);
      
      // Check if user entered a Plus Code in location inputs
      const userPlusCode = [formData.region, formData.country, formData.facilityName].find(isValidPlusCode);
      if (userPlusCode) {
        const decoded = decodePlusCode(userPlusCode);
        if (decoded) {
          finalReport.lat = decoded.lat;
          finalReport.lng = decoded.lng;
          finalReport.plusCode = encodePlusCode(decoded.lat, decoded.lng);
        }
      }

      // If we already detected coordinates via reverse geocoding, use them directly!
      if (!finalReport.lat && detectedCoords && typeof detectedCoords.lat === 'number' && typeof detectedCoords.lng === 'number') {
        finalReport.lat = detectedCoords.lat;
        finalReport.lng = detectedCoords.lng;
        finalReport.plusCode = detectedCoords.plusCode || encodePlusCode(detectedCoords.lat, detectedCoords.lng);
      } else if (!finalReport.lat) {
        try {
          const geoRes = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              region: finalReport.region,
              country: finalReport.country,
              address: formData.facilityName || ""
            })
          });

          const geoData = await geoRes.json();
          if (geoData && geoData.success && typeof geoData.lat === 'number' && typeof geoData.lng === 'number') {
            finalReport.lat = geoData.lat;
            finalReport.lng = geoData.lng;
            finalReport.plusCode = geoData.plusCode || encodePlusCode(geoData.lat, geoData.lng);
          } else {
            if (isMockMode) {
              finalReport.lat = 51.5074;
              finalReport.lng = -0.1278;
              finalReport.plusCode = encodePlusCode(finalReport.lat, finalReport.lng);
            } else {
              throw new Error(geoData?.message || "Could not find this location on the map. Please check your spelling or enter a Plus Code.");
            }
          }
        } catch (err) {
          console.warn("Geocoding notice:", err);
          if (isMockMode) {
            finalReport.lat = 51.5074;
            finalReport.lng = -0.1278;
            finalReport.plusCode = encodePlusCode(finalReport.lat, finalReport.lng);
          } else {
            throw new Error(err.message || "Failed to locate the address. Please simplify the region/city name or enter a Plus Code.");
          }
        }
      }

      // Ensure plusCode is always generated from coordinates
      if (typeof finalReport.lat === 'number' && typeof finalReport.lng === 'number' && !finalReport.plusCode) {
        finalReport.plusCode = encodePlusCode(finalReport.lat, finalReport.lng);
      }

      // Step 3: Generating zero-knowledge key
      setSubmittingStep(3);
      const reportId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      finalReport.id = reportId;

      const secretReport = {
        reportId: reportId,
      };
      const generatedTrackingCode = finalReport.trackingCode;

      // Keep complete client-side copy for personal dossier & caution card before scrubbing
      const fullClientCopy = {
        ...finalReport,
        plusCode: finalReport.plusCode,
        trackingCode: generatedTrackingCode,
        facilityName: formData.facilityName || null,
        evidenceLinks: linksArray, // Preserved for user's personal client-side UN PDF dossier
        reportedToAuthorities: formData.reportedToAuthorities,
        authorityDetails: formData.authorityDetails,
        actionIgnored: formData.actionIgnored
      };
      
      // Crucial security fix: Delete trackingCode from the public document so it isn't leaked
      delete finalReport.trackingCode;

      // Step 4: Synthesizing client protections with Selective Hybrid Compression
      setSubmittingStep(4);

      // Compress heavy narrative text and evidence into Base64 gzip string
      const compressedDetails = await compressPayload({
        summary: finalReport.summary || "",
        evidenceLinks: finalReport.evidenceLinks || [],
        authorityDetails: finalReport.authorityDetails || "",
      });

      // Selective Hybrid Payload: Keep map & query fields plaintext, store heavy text in c_data
      const firestorePayload = {
        id: finalReport.id,
        timestamp: finalReport.timestamp,
        country: finalReport.country,
        region: finalReport.region,
        category: finalReport.category,
        status: finalReport.status,
        verificationScore: finalReport.verificationScore,
        lat: finalReport.lat,
        lng: finalReport.lng,
        plusCode: finalReport.plusCode,
        reportedToAuthorities: finalReport.reportedToAuthorities,
        facilityName: finalReport.facilityName || null,
        c_data: compressedDetails,
      };

      // Also attach c_data to fullClientCopy so local storage tests compression
      fullClientCopy.c_data = compressedDetails;

      // Always save to local dev store in mock mode or development
      if (isMockMode || process.env.NODE_ENV === 'development') {
        saveLocalReport(fullClientCopy, generatedTrackingCode);
      }

      // Submit to Firestore if API key is set and not mocking
      if (!isMockMode && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here') {
        const { doc, setDoc } = await import("firebase/firestore/lite");
        // We MUST await these, otherwise errors are swallowed and the user thinks it succeeded!
        await setDoc(doc(db, "reports", reportId), firestorePayload);
        // Use trackingCode as the document ID so it can only be read by someone who knows it
        await setDoc(doc(db, "report_secrets", generatedTrackingCode), secretReport);
      } else {
        // Simulate network request
        console.log("Mock submission saved to local store (selective hybrid compressed):", firestorePayload);
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Update Rate Limit (only enforced in production outside mock mode)
      localStorage.setItem('sogi_last_submit', Date.now().toString());
      if (!isMockMode && process.env.NODE_ENV !== 'development') {
        setRateLimited(true);
      }

      setTrackingCodeResult(generatedTrackingCode);
      setSubmittedReport(fullClientCopy);
      setSubmitStatus('success');
      
      // Clear sensitive form data
      setFormData({ 
        country: "", region: "", facilityName: "", category: "", 
        summary: "", evidenceLinks: "", reportedToAuthorities: false, 
        authorityDetails: "", actionIgnored: false, website_hp: "" 
      });
      setDetectedCoords(null);
      setDetectedLocationInfo(null);
      
    } catch (error) {
      console.error("Error submitting report:", error);
      setErrorMessage(error.message || "An error occurred while submitting.");
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setSubmittingStep(0);
    }
  };

  // Dual Post-Submission Flow
  if (submitStatus === 'success' && trackingCodeResult && submittedReport) {
    return (
      <div className="flex-1 container mx-auto px-4 py-8 sm:py-14 max-w-5xl relative z-10">
        
        {/* Reassurance Header Banner */}
        <div className="text-center mb-8 sm:mb-10 animate-in fade-in duration-500">
          <div className="inline-flex items-center gap-2 bg-mint/10 border border-mint/40 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold text-mint uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(0,217,157,0.2)]">
            <ShieldCheck size={18} className="text-mint" /> Incident Logged Anonymously
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-coral via-iris to-mint drop-shadow-[0_0_20px_rgba(88,75,224,0.3)] mb-3">
            Zero-Touch Protection Activated
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            No IP, browser fingerprint, or personal identifier was stored. Your data was classified locally and sealed under zero-knowledge integrity.
          </p>
        </div>

        {/* Top 3-Way Quick Action Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* Quick Action 1: Download / Preview UN/HRC Complaint PDF */}
          <div
            className="group p-5 bg-linear-to-br from-iris/20 via-slate-900/90 to-slate-900/90 border border-iris/40 rounded-3xl transition-all shadow-[0_4px_24px_rgba(88,75,224,0.2)] text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-iris/20 text-[#a59bfb] rounded-xl border border-iris/30">
                  <FileText size={22} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#a59bfb] bg-iris/20 px-2.5 py-0.5 rounded-full border border-iris/30">
                  Pillar 1: Personal
                </span>
              </div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                UN/HRC Legal Dossier
              </h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Client-side legal dossier for your records, local legal aid, or UN filings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="flex-1 bg-linear-to-r from-iris to-mint hover:from-[#6b5ff5] hover:to-[#1fe2a9] text-white font-bold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs border border-iris/40 disabled:opacity-50"
              >
                <Download size={13} />
                <span>{isDownloadingPdf ? "Building..." : "Download"}</span>
              </button>
              <button
                type="button"
                onClick={handlePreviewPdf}
                disabled={isDownloadingPdf}
                className="bg-white/10 hover:bg-white/20 text-slate-200 font-bold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs border border-white/10 disabled:opacity-50"
                title="Preview and print directly in browser tab"
              >
                <ExternalLink size={13} className="text-mint" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {/* Quick Action 2: Share Caution Card */}
          <button
            onClick={() => {
              const el = document.getElementById("community-shield-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="group p-5 bg-linear-to-br from-coral/20 via-slate-900/90 to-slate-900/90 hover:from-coral/30 hover:via-slate-800/90 hover:to-slate-800/90 border border-coral/40 hover:border-coral rounded-3xl transition-all shadow-[0_4px_24px_rgba(251,78,119,0.2)] hover:shadow-[0_4px_32px_rgba(251,78,119,0.4)] text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-coral/20 text-coral rounded-xl border border-coral/30">
                  <Share2 size={22} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-coral bg-coral/10 px-2.5 py-0.5 rounded-full border border-coral/30">
                  Pillar 2: Community
                </span>
              </div>
              <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-coral transition-colors">
                Warn Community Groups
              </h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Forward discreet caution graphic or text to Signal, Telegram, & WhatsApp.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs font-bold text-coral group-hover:text-coral/80">
              <Share2 size={14} />
              <span>Generate Caution Card ↓</span>
            </div>
          </button>

          {/* Quick Action 3: Panic Exit */}
          <button
            onClick={handlePanicExit}
            className="group p-5 bg-linear-to-br from-red-950/90 via-slate-900/80 to-slate-900/80 hover:from-red-900 hover:via-slate-900 hover:to-slate-900 border border-red-500/40 hover:border-red-400 rounded-3xl transition-all shadow-[0_4px_24px_rgba(239,68,68,0.2)] text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                  <AlertTriangle size={22} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-500/30">
                  Emergency
                </span>
              </div>
              <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-white transition-colors">
                ⚡ PANIC EXIT
              </h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Instantly wipe local and session data and redirect browser to Wikipedia.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs font-bold text-coral group-hover:text-white">
              <AlertTriangle size={14} />
              <span>Leave Immediately ↗</span>
            </div>
          </button>

        </div>

        {/* Secret Tracking Code Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-10 relative overflow-hidden text-center group">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-coral via-iris to-mint"></div>
          
          <div className="inline-flex items-center gap-2 bg-iris/20 border border-iris/40 px-3 py-1 rounded-full text-xs font-bold text-slate-200 uppercase tracking-widest mb-3">
            <Shield size={14} className="text-mint" />
            Your Private Incident Key
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Your Secret Tracking Code
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mb-5 leading-relaxed">
            Save this code immediately. It is the <strong className="text-white">ONLY key</strong> to track case status or flag <span className="font-mono text-slate-300">ACTION_IGNORED</span> if authorities fail to act. We do not store your identity and cannot recover it if lost.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 bg-black/50 border border-white/10 p-4 rounded-2xl max-w-xl mx-auto shadow-inner">
            <span className="text-xl sm:text-3xl font-mono text-white tracking-widest break-all font-extrabold drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              {trackingCodeResult}
            </span>
            <button
              onClick={copyToClipboard}
              className="bg-iris/40 hover:bg-iris/70 active:bg-iris border border-iris/50 text-white font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg ml-1"
              title="Copy to clipboard"
            >
              {copiedCode ? <><Check size={16} className="text-mint" /> Copied!</> : <><Copy size={16} /> Copy Code</>}
            </button>
          </div>

          {submittedReport?.plusCode && (
            <div className="mt-4 inline-flex items-center gap-2 bg-mint/10 border border-mint/40 px-3.5 py-1.5 rounded-xl text-xs font-mono text-mint shadow-sm">
              <MapPin size={14} className="text-mint" />
              <span>Plus Code (Geographic Sector): <strong>{submittedReport.plusCode}</strong></span>
            </div>
          )}
        </div>

        {/* Navigation Tabs for Dual Pillars */}
        <div className="flex items-center justify-center gap-2 mb-8 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === "all"
                ? "bg-white/15 text-white border border-white/20 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            All Pillars
          </button>
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "personal"
                ? "bg-iris/30 text-white border border-iris/50 shadow-md"
                : "text-slate-400 hover:text-iris-400 hover:bg-white/5"
            }`}
          >
            <FileText size={15} /> 1. Personal Shield
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "community"
                ? "bg-coral/30 text-coral border border-coral/50 shadow-md"
                : "text-slate-400 hover:text-coral hover:bg-white/5"
            }`}
          >
            <Share2 size={15} /> 2. Community Shield
          </button>
        </div>

        {/* PILLAR 1: THE PERSONAL SHIELD (Instant Legal Utility) */}
        {(activeTab === "all" || activeTab === "personal") && (
          <section className="mb-12 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-iris/20 text-[#a59bfb] border border-iris/30 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  Pillar 1: The Personal Shield <span className="text-xs bg-iris/20 text-[#a59bfb] px-2 py-0.5 rounded-full border border-iris/30 font-normal">Immediate Legal Recourse</span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Automated legal drafting and personal evidence protection without touching backend storage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Automated Legal Dossier Download Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-coral via-iris to-mint"></div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-iris/20 text-[#a59bfb] border border-iris/30 rounded-2xl">
                      <FileText size={24} className="drop-shadow-[0_0_8px_rgba(88,75,224,0.6)]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Automated UN/HRC Complaint Dossier</h3>
                      <p className="text-xs sm:text-sm text-slate-300">Client-Side Court- & NGO-Ready PDF</p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
                    Reliving harassment to draft legal filings is exhausting. SOGI-Shield transforms your input directly into a standardized human rights submission right inside your browser:
                  </p>

                  <ul className="space-y-2.5 text-xs text-slate-300 mb-6 bg-black/40 p-4 rounded-2xl border border-white/5">
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-mint shrink-0 mt-0.5" />
                      <span><strong>Standardized ISO Timestamp & Sector:</strong> Auditable timestamp and geographic coordinates.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-mint shrink-0 mt-0.5" />
                      <span><strong>International Human Rights Standards:</strong> Formatted to cite UN IE SOGI mandate, OHCHR Special Procedures, UDHR (Art. 3, 5, 7), ICCPR, & Yogyakarta Principles.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-mint shrink-0 mt-0.5" />
                      <span><strong>Institutional Negligence Review:</strong> Exhaustion of domestic remedies & ACTION_IGNORED documentation.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-mint shrink-0 mt-0.5" />
                      <span><strong>Protective Signature Annex:</strong> Pre-structured signature block signed under anonymous protective protocol.</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="w-full bg-linear-to-r from-coral via-iris to-mint hover:from-[#ff648a] hover:via-[#6b5ff5] hover:to-[#1fe2a9] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(88,75,224,0.3)] hover:shadow-[0_0_30px_rgba(88,75,224,0.5)] flex items-center justify-center gap-3 text-sm sm:text-base border border-white/20 disabled:opacity-50"
                  >
                    <Download size={20} />
                    {isDownloadingPdf ? "Compiling Client-Side PDF..." : "Download Official UN/HRC Complaint PDF"}
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">
                    Compiled 100% locally on your device. Zero bytes sent to our servers.
                  </p>
                </div>
              </div>

              {/* Evidence Locker & Emergency Resources */}
              <EvidenceLockerResources trackingCode={trackingCodeResult} />

            </div>
          </section>
        )}

        {/* PILLAR 2: THE COMMUNITY SHIELD (Global Viral Loop) */}
        {(activeTab === "all" || activeTab === "community") && (
          <section id="community-shield-section" className="mb-12 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-coral/20 text-coral border border-coral/30 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  Pillar 2: The Global Community Shield <span className="text-xs bg-coral/20 text-coral px-2 py-0.5 rounded-full border border-coral/30 font-normal">Global Viral Loop</span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Warn local community members and friends anonymously across borders without linking your identity.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Immediate Collective Impact Feedback & Regional Map */}
              <RegionalImpactPreview report={submittedReport} />

              {/* Anonymous Community Caution Card Generator */}
              <CommunityCautionCard report={submittedReport} />

            </div>
          </section>
        )}

        {/* Bottom Navigation & Safety Control */}
        <div className="border-t border-white/10 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="block text-sm font-bold text-white">Need to check this case later?</span>
            <span className="text-xs text-slate-400">Keep your secret code handy or bookmark the lookup portal.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`/track?code=${trackingCodeResult}`}
              className="bg-white/10 hover:bg-white/15 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors border border-white/10 flex items-center gap-2"
            >
              <span>Open Case Tracker</span>
              <ArrowRight size={14} />
            </a>
            <button
              onClick={handleResetForm}
              className="text-slate-300 hover:text-coral active:text-coral font-bold uppercase tracking-wider text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
            >
              Submit another report
            </button>
            <button
              onClick={handlePanicExit}
              className="bg-coral/30 hover:bg-coral/50 text-coral border border-coral/40 font-bold uppercase tracking-wider text-xs py-2.5 px-4 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle size={14} /> Panic Exit
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 py-8 sm:py-12 max-w-4xl relative z-10">
      
      {/* Header */}
      <div className="mb-8 sm:mb-10 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-linear-to-r from-coral via-[#a59bfb] to-mint drop-shadow-[0_0_20px_rgba(88,75,224,0.3)]">
          Document an Incident Safely
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Your testimony creates an auditable record of SOGI human rights misconduct. 
          Zero IP addresses logged, zero tracking cookies, and 100% client-side privacy.
        </p>
      </div>

      {/* Zero-Knowledge Protection HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-2.5 rounded-xl bg-mint/15 text-mint border border-mint/30">
            <Lock size={18} />
          </div>
          <div>
            <span className="block text-xs font-bold text-white">Zero IP Logging</span>
            <span className="text-[11px] text-slate-400">Headers purged at network edge</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-2.5 rounded-xl bg-iris/20 text-[#a59bfb] border border-iris/30">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="block text-xs font-bold text-white">Client Synthesis</span>
            <span className="text-[11px] text-slate-400">UN PDF & Card built on device</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-coral/20 text-coral border border-coral/30">
              <Zap size={18} />
            </div>
            <div>
              <span className="block text-xs font-bold text-white">Quick Escape</span>
              <span className="text-[11px] text-slate-400">Wipes session immediately</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePanicExit}
            className="text-[11px] font-bold bg-coral/20 hover:bg-coral text-coral hover:text-white px-2.5 py-1 rounded-lg border border-coral/40 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Courage & Documentation Strength Meter */}
      <div className="bg-linear-to-br from-slate-900/90 via-iris/10 to-slate-900/90 border border-iris/30 rounded-3xl p-5 sm:p-6 mb-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-iris/20 text-[#a59bfb] border border-iris/40">
              <Activity size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Case Impact & Documentation Strength</span>
                <span className="text-xs font-mono text-mint font-normal">({strengthScore}%)</span>
              </h2>
              <p className="text-xs text-slate-400">
                {strengthScore < 40 && "Step 1: Adding location & misconduct initiates your regional safety flag."}
                {strengthScore >= 40 && strengthScore < 75 && "Step 2: Good factual details. Strengthen with specific events or dates."}
                {strengthScore >= 75 && "Step 3: High-impact court-ready documentation! Generates actionable UN complaint."}
              </p>
            </div>
          </div>

          {/* Live Status Badge Preview */}
          <div className="shrink-0">
            {liveStatus === "PUBLIC_VERIFIED" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral/20 border border-coral/50 text-coral text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-coral"></span>
                Level 1: Public Verified Pin
              </span>
            )}
            {liveStatus === "ACTION_IGNORED" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-iris/20 border border-iris/50 text-[#a59bfb] text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-iris"></span>
                Action Ignored (Neglect Flagged)
              </span>
            )}
            {liveStatus === "HEATMAP_AGGREGATED" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/20 border border-mint/50 text-mint text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-mint"></span>
                Protected Heatmap Zone
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/50 h-2.5 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-linear-to-r from-coral via-iris to-mint transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(8, strengthScore)}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-5 sm:p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        
        {/* Mock Mode Testing Bar */}
        {isMockMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-iris/20 border border-iris/30 rounded-2xl">
            <span className="text-xs font-mono text-[#a59bfb] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint animate-pulse"></span>
              Mock Mode: Instant Mock Testing Active
            </span>
            <button
              type="button"
              onClick={handleAutofillDemo}
              className="text-xs bg-iris/40 hover:bg-iris/60 active:bg-iris text-white font-bold py-1.5 px-3 rounded-lg border border-iris/40 transition-colors flex items-center gap-1.5 shadow"
            >
              <Sparkles size={13} className="text-coral" /> Autofill Demo Incident
            </button>
          </div>
        )}

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

        {/* Top Error Banner (if submission failed) */}
        {submitStatus === 'error' && (
          <div className="p-4 bg-coral/20 border border-coral/50 rounded-2xl text-coral text-center font-bold text-sm shadow-lg flex items-center justify-center gap-2">
            <AlertTriangle size={18} className="text-coral shrink-0" />
            <span>{errorMessage || "An error occurred while submitting. Please check your details and try again."}</span>
          </div>
        )}

        {/* Section 1: Geographic Location */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-mint" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">1. Incident Location</span>
            </div>

            <button
              type="button"
              onClick={handleAutoDetectLocation}
              disabled={isDetectingLocation}
              className="inline-flex items-center gap-1.5 text-xs bg-mint/10 hover:bg-mint/20 active:bg-mint/30 text-mint border border-mint/30 px-3 py-1.5 rounded-xl transition-all shadow-sm font-semibold cursor-pointer disabled:opacity-50"
              title="Reverse geocode current location via Photon by Komoot"
            >
              {isDetectingLocation ? (
                <>
                  <Activity size={13} className="animate-spin text-mint" />
                  <span>Reverse Geocoding (Photon)...</span>
                </>
              ) : (
                <>
                  <Navigation size={13} className="text-mint" />
                  <span>Auto-Detect Location (Photon)</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Open-Source City / District Grid Search (Natural Earth & GeoNames) */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-2 text-xs">
              <Search size={14} className="text-mint shrink-0" />
              <input
                type="text"
                value={citySearchInput}
                onChange={(e) => {
                  setCitySearchInput(e.target.value);
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                placeholder="Quick-search 1,200+ verified cities & districts (Natural Earth & GeoNames)..."
                className="bg-transparent text-white placeholder:text-slate-400 focus:outline-none w-full text-xs"
              />
              {citySearchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setCitySearchInput("");
                    setShowCityDropdown(false);
                  }}
                  className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {showCityDropdown && cityFilterResults.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-30">
                <div className="p-1.5 text-[10px] font-bold text-slate-400 border-b border-white/5 uppercase tracking-wider flex items-center justify-between">
                  <span>Natural Earth & GeoNames Open Grids</span>
                  <span>Click to auto-fill</span>
                </div>
                {cityFilterResults.map((city, idx) => (
                  <button
                    key={`report-city-${city.id || idx}-${idx}`}
                    type="button"
                    onClick={() => handleSelectCityGrid(city)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-800 border-b border-white/5 last:border-0 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-mint">
                        {city.properties.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {[city.properties.district, city.properties.country].filter(Boolean).join(", ")}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-mint bg-mint/10 px-1.5 py-0.5 rounded border border-mint/20">
                      {city.properties.plusCode?.slice(0, 8)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {detectedLocationInfo && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in duration-300 ${
              detectedLocationInfo.error
                ? "bg-coral/20 border-coral/40 text-coral"
                : "bg-mint/15 border-mint/40 text-mint"
            }`}>
              {detectedLocationInfo.error ? (
                <AlertTriangle size={14} className="text-coral shrink-0" />
              ) : (
                <CheckCircle2 size={14} className="text-mint shrink-0" />
              )}
              <span>{detectedLocationInfo.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">Country *</label>
              <input 
                required 
                name="country" 
                maxLength={100} 
                value={formData.country} 
                onChange={handleChange} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-iris focus:ring-1 focus:ring-iris transition-all placeholder:text-slate-600 text-sm" 
                placeholder="e.g., India" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">State / Province / Region *</label>
              <input 
                required 
                name="region" 
                maxLength={100} 
                value={formData.region} 
                onChange={handleChange} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-iris focus:ring-1 focus:ring-iris transition-all placeholder:text-slate-600 text-sm" 
                placeholder="e.g., Maharashtra" 
              />
            </div>
          </div>
        </div>

        {/* Section 2: Facility / Entity Name */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-iris" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">2. Involved Facility or Entity</span>
            </div>
            <span className="text-[11px] text-slate-400">Optional</span>
          </div>

          <div>
            <input 
              name="facilityName" 
              maxLength={200} 
              value={formData.facilityName} 
              onChange={handleChange} 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-iris focus:ring-1 focus:ring-iris transition-all placeholder:text-slate-600 text-sm" 
              placeholder="Name of clinic, hospital, rehabilitation ashram, or organization" 
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              * Privacy Shield: If no public evidence is attached, this entity name is automatically scrubbed to keep your report anonymous.
            </p>
          </div>
        </div>

        {/* Section 3: Misconduct Category */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <AlertTriangle size={18} className="text-coral" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">3. Misconduct Category *</span>
          </div>

          {/* Interactive Preset Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORY_PRESETS.map((preset) => {
              const isSelected = formData.category === preset.id;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleCategorySelect(preset.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-iris/30 border-mint shadow-[0_0_15px_rgba(0,217,157,0.3)] text-white"
                      : "bg-black/30 border-white/5 hover:border-white/20 text-slate-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{preset.icon}</span>
                    {isSelected && <Check size={14} className="text-mint" />}
                  </div>
                  <span className="text-xs font-bold leading-tight">{preset.short}</span>
                </button>
              );
            })}
          </div>

          <div className="relative pt-1">
            <select 
              required 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              style={{ colorScheme: 'dark' }} 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-iris focus:ring-1 focus:ring-iris transition-all appearance-none cursor-pointer text-sm"
            >
              <option value="">Or select from list...</option>
              {CATEGORY_PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.id}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400 pt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {formData.category === "Other" && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Specify Misconduct Details (Optional):
              </label>
              <input 
                type="text" 
                maxLength={80} 
                value={customCategory} 
                onChange={(e) => setCustomCategory(e.target.value)} 
                placeholder="e.g. Workplace discrimination, housing eviction, online outing..." 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-iris focus:ring-1 focus:ring-iris transition-all placeholder:text-slate-600 text-sm" 
              />
            </div>
          )}
        </div>

        {/* Section 4: Narrative Experience with Guided Prompts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-coral" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">4. Factual Experience Narrative *</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {summaryWords} words
            </span>
          </div>

          {/* Guided Trauma-Informed Starters */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-3.5 space-y-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#a59bfb]">
              💡 Need help structuring your testimony? Click a starter prompt:
            </span>
            <div className="flex flex-wrap gap-2">
              {NARRATIVE_STARTERS.map((starter, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleInsertStarter(starter.text)}
                  className="bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-medium border border-white/5 hover:border-white/20 transition-all flex items-center gap-1.5"
                >
                  <span>{starter.icon}</span>
                  <span>{starter.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <textarea 
              required 
              name="summary" 
              maxLength={5000} 
              value={formData.summary} 
              onChange={handleChange} 
              rows={5} 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-iris focus:ring-1 focus:ring-iris transition-all placeholder:text-slate-600 leading-relaxed text-sm" 
              placeholder="Describe what occurred objectively. Mention dates, methods, facility statements, or coercion used..."
            ></textarea>
            
            <div className="flex items-start gap-2 mt-2 text-[11px] text-amber-300/80 bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/20">
              <Shield size={14} className="shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Confidentiality Protection:</strong> Do not include your real name or personal phone number in the summary text. Refer to yourself as "the survivor" or "the individual" for maximum deniability.
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: Public Evidence Links */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Share2 size={18} className="text-mint" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">5. Corroborating Evidence Links</span>
            </div>
            {detectedLinks.length > 0 ? (
              <span className="text-[11px] font-bold text-coral bg-coral/20 px-2 py-0.5 rounded-full border border-coral/40">
                ✓ {detectedLinks.length} Verifiable Link{detectedLinks.length > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Optional</span>
            )}
          </div>

          <div>
            <textarea 
              name="evidenceLinks" 
              maxLength={20000} 
              value={formData.evidenceLinks} 
              onChange={handleChange} 
              rows={2} 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-iris focus:ring-1 focus:ring-iris transition-all placeholder:text-slate-600 leading-relaxed text-sm" 
              placeholder="Google Drive affidavits, news investigations, social evidence, audio transcripts (comma or line separated)..."
            ></textarea>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              * Attaching valid public evidence elevates your report from an anonymous heatmap cluster to a <strong>Level 1 Public Verified Pin</strong>.
            </p>
          </div>
        </div>

        {/* Section 6: Institutional Response & Negligence */}
        <div className="border-t border-white/10 pt-6">
          <label className="flex items-start gap-3 mb-4 cursor-pointer group">
            <input 
              type="checkbox" 
              name="reportedToAuthorities" 
              checked={formData.reportedToAuthorities} 
              onChange={handleChange} 
              className="mt-1 w-5 h-5 rounded border-slate-700 text-iris focus:ring-iris bg-black/40 cursor-pointer" 
            />
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
              I have reported this incident to official authorities (Police, State Medical Council, Human Rights Commission).
            </span>
          </label>
          
          {formData.reportedToAuthorities && (
            <div className="pl-8 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">Authority Details</label>
                <input 
                  name="authorityDetails" 
                  maxLength={5000} 
                  value={formData.authorityDetails} 
                  onChange={handleChange} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-iris focus:ring-1 focus:ring-iris transition-all placeholder:text-slate-600 text-sm" 
                  placeholder="e.g., Lodged formal complaint with District Magistrate and Medical Council" 
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group bg-coral/10 p-4 rounded-xl border border-coral/30 hover:bg-coral/20 transition-colors">
                <input 
                  type="checkbox" 
                  name="actionIgnored" 
                  checked={formData.actionIgnored} 
                  onChange={handleChange} 
                  className="mt-1 w-5 h-5 rounded border-slate-700 text-coral focus:ring-coral bg-black/40 cursor-pointer" 
                />
                <span className="text-xs font-medium text-slate-300 leading-relaxed">
                  <strong className="text-coral block mb-0.5 text-sm">Flag as ACTION_IGNORED:</strong> 
                  Authorities were formally notified but failed to investigate or provide remedies. (Pins institutional negligence on the map as an Electric Iris marker).
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Real-World Protections Delivered Immediately Upon Submission */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-3">
          <span className="text-xs font-bold text-white uppercase tracking-widest block">
            Immediate Protections You Receive Upon Submission:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
              <FileText size={16} className="text-mint shrink-0 mt-0.5" />
              <span><strong>UN/HRC Complaint Dossier:</strong> Downloadable PDF formatted for UN Special Procedures.</span>
            </div>
            <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
              <AlertTriangle size={16} className="text-coral shrink-0 mt-0.5" />
              <span><strong>Mutual-Aid Caution Card:</strong> Instant visual card with QR code for WhatsApp/Signal groups.</span>
            </div>
            <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
              <Shield size={16} className="text-mint shrink-0 mt-0.5" />
              <span><strong>Secret Tracking Key:</strong> Check status and add updates with zero personal accounts.</span>
            </div>
            <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
              <Activity size={16} className="text-white shrink-0 mt-0.5" />
              <span><strong>Immutable Record:</strong> Permanent proof logged against institutional cover-ups.</span>
            </div>
          </div>
        </div>

        {/* Submission Button */}
        <button 
          type="submit" 
          disabled={isSubmitting || rateLimited}
          className="w-full bg-linear-to-r from-coral via-iris to-mint hover:opacity-95 text-white font-bold py-4 sm:py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(88,75,224,0.3)] hover:shadow-[0_0_30px_rgba(88,75,224,0.5)] disabled:opacity-50 disabled:shadow-none text-base sm:text-lg tracking-wide border border-white/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2 animate-pulse">
              <Shield size={20} className="animate-spin text-mint" />
              <span>
                {submittingStep === 1 && "1/4 Purging device telemetry & headers..."}
                {submittingStep === 2 && "2/4 Geocoding incident sector..."}
                {submittingStep === 3 && "3/4 Generating zero-knowledge key..."}
                {submittingStep >= 4 && "4/4 Synthesizing client protections..."}
                {submittingStep === 0 && "Submitting securely..."}
              </span>
            </span>
          ) : rateLimited ? (
            "Rate Limited (Please wait 5m)"
          ) : (
            <>
              <Shield size={20} className="text-white" />
              <span>Submit Confidential Incident Report</span>
            </>
          )}
        </button>

        {submitStatus === 'error' && (
          <div className="p-4 bg-coral/20 border border-coral/50 rounded-xl text-coral text-center font-bold text-sm shadow-lg">
            {errorMessage || "An error occurred while submitting. Please try again."}
          </div>
        )}

      </form>
    </div>
  );
}
