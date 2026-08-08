"use client";

import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import PanicButton from "./PanicButton";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 pr-[110px] sm:pr-32 flex items-center justify-between">
        <Link href="/" onClick={closeMenu} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors z-[60]">
          <Shield size={24} className="sm:w-7 sm:h-7" />
          <span className="text-lg sm:text-xl font-bold tracking-wider">SOGI-Shield</span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6">
          <Link href="/about" className="text-slate-300 hover:text-white font-medium transition-colors">About</Link>
          <Link href="/" className="text-slate-300 hover:text-white font-medium transition-colors">Global Map</Link>
          <Link href="/report" className="text-slate-300 hover:text-white font-medium transition-colors">File Incident</Link>
          <Link href="/track" className="text-slate-300 hover:text-white font-medium transition-colors">Track Case</Link>
          <Link href="/action-portal" className="text-slate-300 hover:text-white font-medium transition-colors">Portal</Link>
        </nav>

        {/* Mobile Hamburger */}
        <button 
          className="md:hidden text-slate-300 hover:text-white z-[60]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] bg-slate-950/98 backdrop-blur-xl z-[55] flex flex-col items-center justify-start pt-12 gap-8 h-screen border-t border-slate-800">
          <Link href="/about" onClick={closeMenu} className="text-xl text-slate-300 hover:text-white font-bold transition-colors">About</Link>
          <Link href="/" onClick={closeMenu} className="text-xl text-slate-300 hover:text-white font-bold transition-colors">Global Incident Map</Link>
          <Link href="/report" onClick={closeMenu} className="text-xl text-slate-300 hover:text-white font-bold transition-colors">File Incident</Link>
          <Link href="/track" onClick={closeMenu} className="text-xl text-slate-300 hover:text-white font-bold transition-colors">Track Case</Link>
          <Link href="/action-portal" onClick={closeMenu} className="text-xl text-slate-300 hover:text-white font-bold transition-colors">UN & Local HRC Portal</Link>
        </div>
      )}
      <PanicButton />
    </header>
  );
}
