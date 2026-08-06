"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MapClient() {
  const [reports, setReports] = useState([]);
  const [verifiedIcon, setVerifiedIcon] = useState(null);

  useEffect(() => {
    // Fix standard Leaflet icon issues in Next.js when window is available
    if (typeof window !== "undefined") {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // A custom red icon for verified incidents
      const vIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      setVerifiedIcon(vIcon);
    }
  }, []);

  useEffect(() => {
    // Only attempt to connect to Firebase if API key exists, otherwise load dummy data for display
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here') {
      const q = query(collection(db, "reports"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(fetched);
      });
      return () => unsubscribe();
    } else {
      // Firebase not configured yet, no reports to show
      setReports([]);
      console.warn("Firebase API key is missing. Map will remain empty.");
    }
  }, []);

  return (
    <MapContainer 
      center={[20, 0]} 
      zoom={2} 
      scrollWheelZoom={true} 
      className="w-full rounded-lg shadow-inner z-0"
      style={{ height: "100%", minHeight: "500px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {reports.map((report) => {
        if (report.status === "PUBLIC_VERIFIED" && report.lat && report.lng && verifiedIcon) {
          return (
            <Marker key={report.id} position={[report.lat, report.lng]} icon={verifiedIcon}>
              <Popup>
                <div className="text-slate-900">
                  <h3 className="font-bold text-lg mb-1">{report.facilityName || "Verified Incident"}</h3>
                  <p className="text-sm font-semibold text-red-600 mb-2">{report.category}</p>
                  <p className="text-sm mb-2">{report.summary}</p>
                  <div className="mt-2">
                    <strong className="text-xs uppercase text-slate-500">Evidence:</strong>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      {report.evidenceLinks?.map((link, i) => (
                        <li key={i}><a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link {i+1}</a></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        } else if (report.status === "HEATMAP_AGGREGATED" && report.lat && report.lng) {
          // Render aggregated region circles (approximate locations)
          return (
            <CircleMarker
              key={report.id}
              center={[report.lat, report.lng]}
              radius={20} // Could be scaled based on count
              fillColor="#f97316"
              color="#ea580c"
              weight={1}
              opacity={1}
              fillOpacity={0.4}
            >
              <Popup>
                <div className="text-slate-900">
                  <h3 className="font-bold">Region: {report.region || "Unknown"}</h3>
                  <p className="text-sm mt-1">Aggregated Incidents Reported.</p>
                  <p className="text-xs text-slate-500 mt-2">Specific facilities omitted for privacy and safety.</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        }
        return null;
      })}
    </MapContainer>
  );
}
