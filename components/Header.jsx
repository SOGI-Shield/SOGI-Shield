"use client";

import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import PanicButton from "./PanicButton";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-slate-950/70 backdrop-blur-xl border-b border-white/10 sticky top-0 z-[500] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" onClick={closeMenu} className="flex items-center gap-3 group z-[60] select-none">
          <div className="w-9 h-9 sm:w-10 sm:h-10 relative flex items-center justify-center transition-transform group-hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/icon.svg" 
              alt="SOGI-Shield" 
              className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(251,78,119,0.4)] group-hover:drop-shadow-[0_4px_16px_rgba(0,217,157,0.5)] transition-all" 
            />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1">
            <span>SOGI</span>
            <span className="text-[#FB4E77]">-</span>
            <span className="bg-clip-text text-transparent bg-linear-to-r from-[#FB4E77] to-[#00D99D]">Shield</span>
          </span>
        </Link>
        
        <div className="flex flex-1 items-center justify-end gap-2.5 sm:gap-6">
          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="/about" className="text-slate-300 hover:text-white text-sm uppercase tracking-widest font-semibold transition-all">About</Link>
            <Link href="/" className="text-slate-300 hover:text-white text-sm uppercase tracking-widest font-semibold transition-all">Global Map</Link>
            <Link href="/report" className="text-slate-300 hover:text-[#00D99D] text-sm uppercase tracking-widest font-semibold transition-all">File Incident</Link>
            <Link href="/track" className="text-slate-300 hover:text-[#FB4E77] text-sm uppercase tracking-widest font-semibold transition-all">Track Case</Link>
            <Link href="/action-portal" className="text-slate-300 hover:text-white text-sm uppercase tracking-widest font-semibold transition-all">Portal</Link>
            <Link href="/privacy" className="text-slate-300 hover:text-white text-sm uppercase tracking-widest font-semibold transition-all">Privacy</Link>
          </nav>

          <PanicButton />

          {/* Mobile Hamburger */}
          <button 
            className="md:hidden p-2 -mr-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors z-[60]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-0 left-0 w-full h-[100dvh] bg-slate-950/98 backdrop-blur-2xl z-[55] flex flex-col items-center justify-start pt-[90px] gap-2 border-t border-white/10 overflow-y-auto pb-24">
          <div className="flex items-center gap-3 py-3 px-6 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="SOGI-Shield" className="w-9 h-9 object-contain filter drop-shadow-[0_4px_12px_rgba(251,78,119,0.4)]" />
            <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
              <span>SOGI</span>
              <span className="text-[#FB4E77]">-</span>
              <span className="bg-clip-text text-transparent bg-linear-to-r from-[#FB4E77] to-[#00D99D]">Shield</span>
            </span>
          </div>
          <Link href="/about" onClick={closeMenu} className="block w-full text-center py-3.5 text-lg text-slate-200 hover:text-white hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">About</Link>
          <Link href="/" onClick={closeMenu} className="block w-full text-center py-3.5 text-lg text-slate-200 hover:text-[#FB4E77] hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">Global Map</Link>
          <Link href="/report" onClick={closeMenu} className="block w-full text-center py-3.5 text-lg text-slate-200 hover:text-[#00D99D] hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">File Incident</Link>
          <Link href="/track" onClick={closeMenu} className="block w-full text-center py-3.5 text-lg text-slate-200 hover:text-[#FB4E77] hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">Track Case</Link>
          <Link href="/action-portal" onClick={closeMenu} className="block w-full text-center py-3.5 text-lg text-slate-200 hover:text-white hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">Action Portal</Link>
          <Link href="/privacy" onClick={closeMenu} className="block w-full text-center py-3.5 text-lg text-slate-200 hover:text-white hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">Privacy Policy</Link>
        </div>
      )}
    </header>
  );
}
