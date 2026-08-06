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
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
