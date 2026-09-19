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
        <Link href="/" onClick={closeMenu} className="flex items-center gap-2 group z-[60]">
          <Shield size={24} className="sm:w-7 sm:h-7 text-indigo-400 group-hover:text-pink-400 transition-colors duration-300" />
          <span className="text-lg sm:text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400">
            SOGI-Shield
          </span>
        </Link>
        
        <div className="flex flex-1 items-center justify-end gap-3 sm:gap-6">
          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="/about" className="text-slate-300 hover:text-pink-400 text-sm uppercase tracking-widest font-semibold transition-all">About</Link>
            <Link href="/" className="text-slate-300 hover:text-cyan-400 text-sm uppercase tracking-widest font-semibold transition-all">Global Map</Link>
            <Link href="/report" className="text-slate-300 hover:text-indigo-400 text-sm uppercase tracking-widest font-semibold transition-all">File Incident</Link>
            <Link href="/track" className="text-slate-300 hover:text-purple-400 text-sm uppercase tracking-widest font-semibold transition-all">Track Case</Link>
            <Link href="/action-portal" className="text-slate-300 hover:text-rose-400 text-sm uppercase tracking-widest font-semibold transition-all">Portal</Link>
            <Link href="/privacy" className="text-slate-300 hover:text-emerald-400 text-sm uppercase tracking-widest font-semibold transition-all">Privacy</Link>
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
        <div className="md:hidden fixed top-0 left-0 w-full h-[100dvh] bg-slate-950/95 backdrop-blur-2xl z-[55] flex flex-col items-center justify-start pt-[100px] gap-4 border-t border-white/10 overflow-y-auto pb-20">
          <Link href="/about" onClick={closeMenu} className="block w-full text-center py-4 text-xl text-slate-300 hover:text-pink-400 hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">About</Link>
          <Link href="/" onClick={closeMenu} className="block w-full text-center py-4 text-xl text-slate-300 hover:text-cyan-400 hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">Global Map</Link>
          <Link href="/report" onClick={closeMenu} className="block w-full text-center py-4 text-xl text-slate-300 hover:text-indigo-400 hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">File Incident</Link>
          <Link href="/track" onClick={closeMenu} className="block w-full text-center py-4 text-xl text-slate-300 hover:text-purple-400 hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">Track Case</Link>
          <Link href="/action-portal" onClick={closeMenu} className="block w-full text-center py-4 text-xl text-slate-300 hover:text-rose-400 hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">Portal</Link>
          <Link href="/privacy" onClick={closeMenu} className="block w-full text-center py-4 text-xl text-slate-300 hover:text-emerald-400 hover:bg-white/5 active:bg-white/10 font-bold uppercase tracking-widest transition-all">Privacy Policy</Link>
        </div>
      )}
    </header>
  );
}
