import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const cabinetGrotesk = localFont({
  src: "./fonts/cabinetgrotesk/CabinetGrotesk-Variable.woff2",
  variable: "--font-cabinet",
  display: "swap",
  weight: "100 900",
});

const satoshi = localFont({
  src: [
    {
      path: "./fonts/satoshi/Satoshi-Variable.woff2",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "./fonts/satoshi/Satoshi-VariableItalic.woff2",
      style: "italic",
      weight: "100 900",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

export const metadata = {
  title: "SOGI-Shield | Global Human Rights Protection",
  description: "Global LGBTQ+ / non-binary human rights reporting and documentation.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cabinetGrotesk.variable} ${satoshi.variable}`} style={{ colorScheme: 'dark' }}>
      <body className="min-h-screen bg-[#060913] text-slate-200 flex flex-col font-sans selection:bg-coral/30 selection:text-white relative">
        {/* Ambient Background Gradient for Brand Vibe */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-iris/12 blur-[140px]"></div>
          <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-coral/12 blur-[140px]"></div>
          <div className="absolute top-[35%] right-[20%] w-[35%] h-[35%] rounded-full bg-mint/8 blur-[150px]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
