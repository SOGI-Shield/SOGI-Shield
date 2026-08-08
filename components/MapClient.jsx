"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, GeoJSON, useMapEvents } from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db, isMockMode } from "@/lib/firebase";
import { Maximize2, Minimize2 } from "lucide-react";

function MapEvents({ setZoom }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    }
  });
  return null;
}

export default function MapClient() {
  const [reports, setReports] = useState([]);
  const [icons, setIcons] = useState({ red: null, grey: null });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(2);

  useEffect(() => {
    fetch('/countries.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Failed to load geojson", err));
  }, []);

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
      import('@/src/data/mockReports.json').then(m => {
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

  const countryStats = {};
  reports.forEach(report => {
    const country = report.country;
    if (!country) return;
    if (!countryStats[country]) {
      countryStats[country] = { verified: 0, ignored: 0, aggregated: 0, total: 0 };
    }
    countryStats[country].total++;
    if (report.status === "PUBLIC_VERIFIED") countryStats[country].verified++;
    if (report.status === "ACTION_IGNORED") countryStats[country].ignored++;
    if (report.status === "HEATMAP_AGGREGATED") countryStats[country].aggregated++;
  });

  const styleFeature = (feature) => {
    const countryName = feature.properties.name;
    const stats = countryStats[countryName];
    
    if (!stats || stats.total === 0) {
      return { fillColor: "transparent", color: "#64748b", weight: 0.5, opacity: 0.5, fillOpacity: 0 };
    }

    let fillColor = "#D97706"; // Amber (default / moderate)
    
    // High Neglect (more ignored than verified)
    if (stats.ignored > stats.verified) {
      fillColor = "#374151"; // Charcoal Grey
    } 
    // High Density
    else if (stats.total >= 50) {
      fillColor = "#DC2626"; // Deep Red
    }

    return { fillColor, color: "#94a3b8", weight: 1, opacity: 0.8, fillOpacity: 0.6 };
  };

  const onEachFeature = (feature, layer) => {
    const countryName = feature.properties.name;
    const stats = countryStats[countryName];
    if (stats && stats.total > 0) {
      const tooltipContent = `
        <div style="font-family: sans-serif; color: #0f172a;">
          <div style="font-weight: bold; font-size: 14px;">${countryName}</div>
          <div style="font-size: 12px; margin-top: 4px;">Total Incidents: ${stats.total}</div>
          <div style="font-size: 12px; color: #dc2626;">Verified: ${stats.verified}</div>
          <div style="font-size: 12px; color: #64748b;">Ignored: ${stats.ignored}</div>
          <div style="font-size: 12px; color: #d97706;">Aggregated: ${stats.aggregated}</div>
        </div>
      `;
      layer.bindTooltip(tooltipContent, { sticky: true });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-slate-950 p-4 flex flex-col"
    : "relative w-full h-[600px] md:h-[700px] rounded-xl overflow-hidden shadow-2xl border border-slate-700 z-10";

  return (
    <div className={containerClasses}>
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-[400] bg-slate-900/80 hover:bg-indigo-600 text-white p-2 rounded-lg backdrop-blur shadow border border-slate-700 transition-colors pointer-events-auto"
        title="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      <div className="absolute bottom-6 left-4 z-[400] bg-slate-900/80 backdrop-blur text-sm px-4 py-3 rounded-lg border border-slate-700 shadow-lg pointer-events-none text-slate-200">
        <div className="flex items-center gap-2 mb-2"><span className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span> Public Verified</div>
        <div className="flex items-center gap-2 mb-2"><span className="w-3 h-3 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.8)]"></span> Action Ignored</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 opacity-80 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span> Heatmap Aggregated</div>
      </div>

      <MapContainer 
        center={[20, 0]} 
        zoom={2}
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true} 
        preferCanvas={true}
        className="w-full h-full rounded-xl z-0"
        style={{ height: "100%", width: "100%", backgroundColor: "#aad3df" }} // Matches OSM water color
      >
        <MapEvents setZoom={setCurrentZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
          noWrap={true}
        />
        
        {currentZoom < 8 && geoData && (
          <GeoJSON 
            data={geoData} 
            style={styleFeature} 
            onEachFeature={onEachFeature} 
            key={JSON.stringify(countryStats)}
          />
        )}

        {currentZoom >= 8 && (
          <MarkerClusterGroup chunkedLoading>
          {reports.map((report) => {
            if (report.status === "PUBLIC_VERIFIED" && report.lat && report.lng && icons.red) {
              return (
                <Marker key={report.id} position={[report.lat, report.lng]} icon={icons.red}>
                  <Popup>
                    <div className="text-slate-900 min-w-[250px]">
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
                    <div className="text-slate-900 min-w-[250px]">
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
                    <div className="text-slate-900 min-w-[200px]">
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
        )}
      </MapContainer>
    </div>
  );
}
