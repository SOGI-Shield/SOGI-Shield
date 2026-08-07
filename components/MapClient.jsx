"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db, isMockMode } from "@/lib/firebase";
import { Maximize2, Minimize2 } from "lucide-react";

export default function MapClient() {
  const [reports, setReports] = useState([]);
  const [icons, setIcons] = useState({ red: null, grey: null });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Fix standard Leaflet icon issues in Next.js when window is available
    if (typeof window !== "undefined") {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const greyIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      setIcons({ red: redIcon, grey: greyIcon });
    }
  }, []);

  useEffect(() => {
    if (isMockMode) {
      import('@/data/mockReports.json').then(m => {
        setReports(m.default || m);
      }).catch(e => console.error("Failed to load mock reports:", e));
      return;
    }

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here') {
      const q = query(collection(db, "reports"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(fetched);
      });
      return () => unsubscribe();
    } else {
      setReports([]);
      console.warn("Firebase API key is missing. Map will remain empty.");
    }
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-slate-950 p-4 flex flex-col"
    : "relative w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden shadow-2xl border border-slate-700 z-10";

  return (
    <div className={containerClasses}>
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-[400] bg-slate-900/80 hover:bg-indigo-600 text-white p-2 rounded-lg backdrop-blur shadow border border-slate-700 transition-colors"
        title="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      <MapContainer 
        center={[20, 0]} 
        zoom={2}
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true} 
        className="w-full h-full rounded-xl z-0"
        style={{ height: "100%", width: "100%", backgroundColor: "#0f172a" }} // Matches slate-950
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
          noWrap={true}
        />
        
        <MarkerClusterGroup chunkedLoading>
          {reports.map((report) => {
            if (report.status === "PUBLIC_VERIFIED" && report.lat && report.lng && icons.red) {
              return (
                <Marker key={report.id} position={[report.lat, report.lng]} icon={icons.red}>
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
            } else if (report.status === "ACTION_IGNORED" && report.lat && report.lng && icons.grey) {
              return (
                <Marker key={report.id} position={[report.lat, report.lng]} icon={icons.grey}>
                  <Popup>
                    <div className="text-slate-900">
                      <div className="inline-block bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded mb-2 uppercase tracking-wide">
                        Action Ignored
                      </div>
                      <h3 className="font-bold text-lg mb-1">{report.facilityName || "Incident"}</h3>
                      <p className="text-sm font-semibold text-slate-600 mb-2">{report.category}</p>
                      <p className="text-sm mb-2">{report.summary}</p>
                      
                      <div className="bg-slate-100 p-2 rounded mt-2 border border-slate-200">
                        <strong className="text-xs uppercase text-slate-500 block mb-1">Institutional Response:</strong>
                        <p className="text-xs text-slate-700">{report.authorityDetails || "Reported to authorities. No action taken."}</p>
                      </div>

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
              return (
                <CircleMarker
                  key={report.id}
                  center={[report.lat, report.lng]}
                  radius={20}
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
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
