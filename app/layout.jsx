import "./globals.css";
import Header from "@/components/Header";
// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "SOGI-Shield",
  description: "Global LGBTQ+ / non-binary human rights reporting and documentation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ colorScheme: 'dark' }}>
      <body className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-pink-500/30 relative">
        {/* Ambient Background Gradient for Brand Vibe */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-900/10 blur-[120px]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
