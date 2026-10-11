"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { downloadFile } from "@/lib/utils";
import { 
  Share2, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle, 
  QrCode, 
  ExternalLink,
  MessageSquare,
  Send,
  Shield
} from "lucide-react";

export default function CommunityCautionCard({ report }) {
  const { region, country, category, lat, lng } = report || {};
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const canvasRef = useRef(null);

  // Determine origin safely
  const [origin, setOrigin] = useState("https://sogi-shield.org");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const shareUrl = lat && lng 
    ? `${origin}/?lat=${lat}&lng=${lng}&zoom=11`
    : `${origin}`;

  const warningText = `⚠️ SOGI Safety Alert: Incident flagged near ${region || "Sector"}, ${country || "Global"} (${category || "Safety Violation"}). Live safety map updated on SOGI-Shield: ${shareUrl}`;

  // Generate QR Code
  useEffect(() => {
    if (shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: "#0f172a", // deep slate
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error("Error generating QR code:", err));
    }
  }, [shareUrl]);

  // Copy Warning Text
  const handleCopyText = () => {
    navigator.clipboard.writeText(warningText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2200);
  };

  // Copy Direct Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // Render & Download Image
  const drawCautionCardToCanvas = async () => {
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const width = 800;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    // Dark sleek background with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#020617"); // slate-950
    gradient.addColorStop(0.5, "#0b0f19");
    gradient.addColorStop(1, "#171026"); // subtle dark purple
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Glowing border
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)"; // red alert glow
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Top Warning Bar
    const topBarGrad = ctx.createLinearGradient(0, 0, width, 0);
    topBarGrad.addColorStop(0, "#ef4444");
    topBarGrad.addColorStop(0.5, "#f97316");
    topBarGrad.addColorStop(1, "#ec4899");
    ctx.fillStyle = topBarGrad;
    ctx.fillRect(8, 8, width - 16, 8);

    // Badge
    ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
    ctx.fillRect(40, 40, 260, 36);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, 260, 36);

    ctx.fillStyle = "#fca5a5";
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("⚠️ SOGI SAFETY CAUTION", 55, 63);

    // Main Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("INCIDENT FLAGGED IN SECTOR", 40, 115);

    // Sector Location (constrained so it never overlaps the QR box at x=540)
    ctx.fillStyle = "#38bdf8"; // sky blue
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const locText = `${region || "Sector"}, ${country || "Global"}`;
    let displayLoc = locText;
    if (ctx.measureText(displayLoc).width > 480) {
      while (displayLoc.length > 3 && ctx.measureText(displayLoc + "...").width > 480) {
        displayLoc = displayLoc.slice(0, -1);
      }
      displayLoc += "...";
    }
    ctx.fillText(displayLoc, 40, 150);

    // Category
    ctx.fillStyle = "#94a3b8"; // slate-400
    ctx.font = "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let catText = `Category: ${category || "Human Rights Violation"}`;
    if (ctx.measureText(catText).width > 480) {
      while (catText.length > 3 && ctx.measureText(catText + "...").width > 480) {
        catText = catText.slice(0, -1);
      }
      catText += "...";
    }
    ctx.fillText(catText, 40, 185);

    // Descriptive advisory box
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(40, 215, 450, 140);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 215, 450, 140);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Community Advisory:", 55, 245);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("An incident has been logged and updated on the", 55, 275);
    ctx.fillText("SOGI-Shield decentralized monitoring grid.", 55, 298);
    ctx.fillText("Community members and allies in this sector are", 55, 321);
    ctx.fillText("advised to exercise situational caution.", 55, 344);

    // Watermark / Verification notice
    ctx.fillStyle = "#64748b";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Zero-Touch Confidentiality • No Metadata Logged", 40, 400);
    ctx.fillStyle = "#818cf8";
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("SOGI-Shield Global Human Rights Platform | sogi-shield.org", 40, 425);

    // Draw QR Code on the right
    let targetQr = qrCodeUrl;
    if (!targetQr && shareUrl) {
      try {
        targetQr = await QRCode.toDataURL(shareUrl, {
          width: 240,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
      } catch (err) {
        console.warn("Direct QR generation fallback:", err);
      }
    }

    if (targetQr) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = targetQr;
        if (typeof img.decode === "function") {
          await img.decode();
        } else {
          await new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(540, 100, 210, 260);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(540, 100, 210, 260);

        ctx.drawImage(img, 555, 115, 180, 180);

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SCAN FOR LIVE MAP", 645, 320);
        ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#475569";
        ctx.fillText("Verified Coordinates", 645, 340);
        ctx.textAlign = "left";
      } catch (e) {
        console.error("Canvas QR draw error:", e);
      }
    }

    return canvas;
  };

  // Download Card
  const handleDownloadCard = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = await drawCautionCardToCanvas();
      if (!canvas) return;
      const safeRegion = (region || "Sector").replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `SOGI_Safety_Caution_${safeRegion}.png`;

      if (typeof canvas.toBlob === "function") {
        canvas.toBlob((blob) => {
          if (blob) {
            downloadFile(blob, filename, "image/png");
          } else {
            const dataUrl = canvas.toDataURL("image/png");
            downloadFile(dataUrl, filename, "image/png");
          }
        }, "image/png");
      } else {
        const dataUrl = canvas.toDataURL("image/png");
        downloadFile(dataUrl, filename, "image/png");
      }
    } catch (err) {
      console.error("Failed to generate caution card image:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = await drawCautionCardToCanvas();
      if (!canvas) return;
      await new Promise((resolve) => {
        if (typeof canvas.toBlob !== "function") {
          handleDownloadCard();
          resolve();
          return;
        }
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve();
            return;
          }
          try {
            if (typeof ClipboardItem !== "undefined" && navigator.clipboard && navigator.clipboard.write) {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob })
              ]);
              setCopiedImage(true);
              setTimeout(() => setCopiedImage(false), 2200);
            } else {
              handleDownloadCard();
            }
          } catch (clipErr) {
            console.warn("ClipboardItem image copy unsupported, falling back to download:", clipErr);
            handleDownloadCard();
          }
          resolve();
        }, "image/png");
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 1-Tap Social Shares
  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`⚠️ SOGI Safety Alert: Incident flagged near ${region || "Sector"}, ${country || "Global"}. Live map updated:`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleWhatsappShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(warningText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SOGI Safety Caution Alert",
          text: warningText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500"></div>
      <canvas ref={canvasRef} className="hidden" />

      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl">
              <AlertTriangle size={24} className="drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Community Caution Card</h3>
              <p className="text-sm text-slate-300">
                Warn your local community & mutual-aid groups anonymously
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
            <Shield size={12} className="text-emerald-400" /> 100% Anonymous
          </span>
        </div>

        {/* Visual Caution Card Preview */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-rose-500/30 rounded-2xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-rose-500"></div>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-rose-950/60 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-bold text-rose-300 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                ⚠️ SOGI Safety Alert
              </div>
              <h4 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                Incident Flagged near {region || "Sector"}, {country || "Global"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Live decentralized safety map updated on <span className="text-indigo-300 font-semibold">SOGI-Shield</span>. Exercise heightened situational awareness in this vicinity.
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-400 font-mono">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-rose-300 font-sans font-medium">
                  {category}
                </span>
                <span>• No personal sender info</span>
              </div>
            </div>

            {/* QR Code Frame */}
            {qrCodeUrl && (
              <div className="bg-white p-2.5 rounded-xl shadow-xl flex-shrink-0 flex flex-col items-center">
                <img src={qrCodeUrl} alt="Scan for Live Safety Map" className="w-28 h-28 sm:w-32 sm:h-32 object-contain" />
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mt-1 text-center">
                  Scan for Map
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Copyable Quick Text Snippet Box */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Discreet Text Snippet for Messaging Groups
            </span>
            <button
              onClick={handleCopyText}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors"
            >
              {copiedText ? <><Check size={14} className="text-emerald-400" /> Copied!</> : <><Copy size={14} /> Copy Text</>}
            </button>
          </div>
          <p className="text-xs text-slate-300 font-mono bg-black/50 p-2.5 rounded-xl border border-white/5 leading-relaxed break-all select-all">
            {warningText}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Download Graphic Card Image */}
          <button
            onClick={handleDownloadCard}
            disabled={isGeneratingImage}
            className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 active:from-rose-700 active:to-pink-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 text-sm border border-rose-400/30"
          >
            <Download size={18} />
            {isGeneratingImage ? "Rendering Card..." : "Download Graphic Card (.PNG)"}
          </button>

          {/* Copy Image / Copy Link */}
          <button
            onClick={handleCopyImage}
            disabled={isGeneratingImage}
            className="w-full bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-white/10"
          >
            {copiedImage ? (
              <>
                <Check size={18} className="text-emerald-400" /> Image Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy size={18} /> Copy Card Image
              </>
            )}
          </button>
        </div>

        {/* 1-Tap Share Bar for Encrypted Groups */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-white/10 text-xs">
          <span className="text-slate-400 mr-1 font-medium">Forward to:</span>
          
          <button
            onClick={handleTelegramShare}
            className="bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] border border-[#229ED9]/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors"
          >
            <Send size={14} /> Telegram
          </button>

          <button
            onClick={handleWhatsappShare}
            className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors"
          >
            <MessageSquare size={14} /> WhatsApp
          </button>

          <button
            onClick={handleCopyLink}
            className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors"
          >
            {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} 
            {copiedLink ? "Link Copied" : "Copy Regional Link"}
          </button>

          {typeof navigator !== "undefined" && navigator.share && (
            <button
              onClick={handleNativeShare}
              className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors"
            >
              <Share2 size={14} /> More...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
