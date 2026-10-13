"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { downloadFile, openInNewTab, buildSafeMapUrl } from "@/lib/utils";
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
  Shield,
  MapPin
} from "lucide-react";

export default function CommunityCautionCard({ report }) {
  const { region, country, category, lat, lng } = report || {};
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const canvasRef = useRef(null);

  const plusCode = report?.plusCode || (lat && lng ? encodePlusCode(lat, lng) : null);
  const sector = plusCode ? `Plus Code ${plusCode}` : (region || country || "Sector");

  // 1. Get origin for the functional QR link (includes https:// or http://)
  const resolvedOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://sogi-shield.org';

  // 2. Get host for the clean visual text footer (e.g., "sogi-shield.org" or "localhost:3000")
  const displayHost = typeof window !== 'undefined' && window.location.host ? window.location.host : 'sogi-shield.org';

  // 3. Construct live map URL for the QR code
  const qrTargetUrl = lat && lng 
    ? buildSafeMapUrl(lat, lng, 11, resolvedOrigin)
    : `${resolvedOrigin}/#map?sector=${encodeURIComponent(sector)}`;

  const shareUrl = qrTargetUrl;

  const warningText = `⚠️ SOGI Safety Alert: Incident flagged near ${region || "Area"}, ${country || "Global"}${plusCode ? ` (Plus Code: ${plusCode})` : ""} (${category || "Safety Violation"}). Live safety map updated on SOGI-Shield: ${shareUrl}`;

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
    gradient.addColorStop(0, "#060913"); // brand dark surface
    gradient.addColorStop(0.5, "#0d1326");
    gradient.addColorStop(1, "#181436"); // dark iris tint
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Glowing border
    ctx.strokeStyle = "rgba(251, 78, 119, 0.5)"; // Coral Rose alert glow
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Top Brand Gradient Bar
    const topBarGrad = ctx.createLinearGradient(0, 0, width, 0);
    topBarGrad.addColorStop(0, "#FB4E77"); // Coral Rose
    topBarGrad.addColorStop(0.5, "#584BE0"); // Electric Iris
    topBarGrad.addColorStop(1, "#00D99D"); // Vivid Mint
    ctx.fillStyle = topBarGrad;
    ctx.fillRect(8, 8, width - 16, 8);

    // Badge
    ctx.fillStyle = "rgba(251, 78, 119, 0.2)";
    ctx.fillRect(40, 40, 260, 36);
    ctx.strokeStyle = "#FB4E77";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, 260, 36);

    ctx.fillStyle = "#FB4E77";
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("⚠️ SOGI SAFETY CAUTION", 55, 63);

    // Main Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("INCIDENT FLAGGED IN SECTOR", 40, 115);

    // Sector Location (constrained so it never overlaps the QR box at x=540)
    ctx.fillStyle = "#00D99D"; // Vivid Mint
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const locText = `${region || "Area"}, ${country || "Global"}`;
    let displayLoc = locText;
    if (ctx.measureText(displayLoc).width > 480) {
      while (displayLoc.length > 3 && ctx.measureText(displayLoc + "...").width > 480) {
        displayLoc = displayLoc.slice(0, -1);
      }
      displayLoc += "...";
    }
    ctx.fillText(displayLoc, 40, 145);

    // Plus Code badge if available
    let nextY = 175;
    if (plusCode) {
      ctx.fillStyle = "#00D99D";
      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.fillText(`PLUS CODE: ${plusCode}`, 40, nextY);
      nextY += 22;
    }

    // Category
    ctx.fillStyle = "#94a3b8"; // slate-400
    ctx.font = "15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let catText = `Category: ${category || "Human Rights Violation"}`;
    if (ctx.measureText(catText).width > 480) {
      while (catText.length > 3 && ctx.measureText(catText + "...").width > 480) {
        catText = catText.slice(0, -1);
      }
      catText += "...";
    }
    ctx.fillText(catText, 40, nextY);

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
    ctx.fillText(`SOGI-Shield Global Human Rights Platform | ${displayHost}`, 40, 425);

    // Draw QR Code on the right
    let targetQr = qrCodeUrl;
    if (!targetQr && qrTargetUrl) {
      try {
        targetQr = await QRCode.toDataURL(qrTargetUrl, {
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

      // Direct Data URL ensures instantaneous, non-revocable, uncorrupted PNG generation on Windows
      const dataUrl = canvas.toDataURL("image/png");
      downloadFile(dataUrl, filename, "image/png");
    } catch (err) {
      console.error("Failed to generate caution card image:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Preview / Open in New Tab
  const handlePreviewCard = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = await drawCautionCardToCanvas();
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      openInNewTab(dataUrl, "image/png");
    } catch (err) {
      console.error("Failed to preview caution card image:", err);
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
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-coral/40 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between transition-all">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-coral via-iris to-mint"></div>
      <canvas ref={canvasRef} className="hidden" />

      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-coral/15 text-coral border border-coral/30 rounded-2xl">
              <AlertTriangle size={24} className="drop-shadow-[0_0_8px_rgba(251,78,119,0.6)]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Community Caution Card</h3>
              <p className="text-sm text-slate-300">
                Warn your local community & mutual-aid groups anonymously
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
            <Shield size={12} className="text-mint" /> 100% Anonymous
          </span>
        </div>

        {/* Visual Caution Card Preview */}
        <div className="bg-linear-to-br from-slate-950 via-[#060913] to-slate-950 border border-coral/40 rounded-2xl p-5 sm:p-6 mb-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-coral via-iris to-mint"></div>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-coral/20 border border-coral/40 px-3 py-1 rounded-full text-xs font-bold text-coral uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-coral animate-ping"></span>
                ⚠️ SOGI Safety Alert
              </div>
              <h4 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                Incident Flagged near {region || "Area"}, {country || "Global"}
              </h4>
              {plusCode && (
                <div className="inline-flex items-center gap-1.5 bg-mint/15 border border-mint/40 text-mint font-mono text-xs px-2.5 py-1 rounded-lg">
                  <MapPin size={12} className="text-mint" />
                  <span>Plus Code: <strong>{plusCode}</strong></span>
                </div>
              )}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Live decentralized safety map updated on <span className="text-mint font-semibold">SOGI-Shield</span>. Exercise heightened situational awareness in this vicinity.
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-400 font-mono">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-coral font-sans font-medium">
                  {category}
                </span>
                <span>• No personal sender info</span>
              </div>
            </div>

            {/* QR Code Frame */}
            {qrCodeUrl && (
              <div className="bg-white p-2.5 rounded-xl shadow-xl shrink-0 flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Discreet Text Snippet for Messaging Groups
            </span>
            <button
              onClick={handleCopyText}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {copiedText ? <><Check size={14} className="text-mint" /> Copied!</> : <><Copy size={14} /> Copy Text</>}
            </button>
          </div>
          <p className="text-xs text-slate-300 font-mono bg-black/50 p-2.5 rounded-xl border border-white/5 leading-relaxed break-all select-all">
            {warningText}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Download Graphic Card Image */}
          <button
            onClick={handleDownloadCard}
            disabled={isGeneratingImage}
            className="w-full bg-coral hover:opacity-95 text-white font-bold py-3.5 px-3 rounded-xl transition-all shadow-[0_0_15px_rgba(251,78,119,0.4)] flex items-center justify-center gap-2 text-sm border border-coral/40 disabled:opacity-50 cursor-pointer"
          >
            <Download size={17} />
            <span>{isGeneratingImage ? "Rendering..." : "Download (.PNG)"}</span>
          </button>

          {/* View / Open in Browser Tab */}
          <button
            onClick={handlePreviewCard}
            disabled={isGeneratingImage}
            className="w-full bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-bold py-3.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-white/10 disabled:opacity-50 cursor-pointer"
            title="Open high-resolution graphic directly in browser"
          >
            <ExternalLink size={17} className="text-mint" />
            <span>Open in Tab</span>
          </button>

          {/* Copy Image to Clipboard */}
          <button
            onClick={handleCopyImage}
            disabled={isGeneratingImage}
            className="w-full bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-bold py-3.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-white/10 disabled:opacity-50 cursor-pointer"
          >
            {copiedImage ? (
              <>
                <Check size={17} className="text-mint" /> <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={17} /> <span>Copy Image</span>
              </>
            )}
          </button>
        </div>

        {/* 1-Tap Share Bar for Encrypted Groups */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-white/10 text-xs">
          <span className="text-slate-400 mr-1 font-medium">Forward to:</span>
          
          <button
            onClick={handleTelegramShare}
            className="bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] border border-[#229ED9]/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
          >
            <Send size={14} /> Telegram
          </button>

          <button
            onClick={handleWhatsappShare}
            className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
          >
            <MessageSquare size={14} /> WhatsApp
          </button>

          <button
            onClick={handleCopyLink}
            className="bg-iris/20 hover:bg-iris/30 text-slate-200 hover:text-white border border-iris/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
          >
            {copiedLink ? <Check size={14} className="text-mint" /> : <Copy size={14} />} 
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
