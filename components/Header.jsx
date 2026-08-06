import Link from "next/link";
import { Shield } from "lucide-react";
import PanicButton from "./PanicButton";

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 pr-32 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
          <Shield size={28} />
          <span className="text-xl font-bold tracking-wider">SOGI-Shield</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/" className="text-slate-300 hover:text-white font-medium transition-colors">Global Incident Map</Link>
          <Link href="/report" className="text-slate-300 hover:text-white font-medium transition-colors">File Incident</Link>
          <Link href="/action-portal" className="text-slate-300 hover:text-white font-medium transition-colors">UN & Local HRC Portal</Link>
        </nav>
      </div>
      <PanicButton />
    </header>
  );
}
