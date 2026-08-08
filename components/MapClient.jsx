"use client";

import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, GeoJSON, useMapEvents, ZoomControl } from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db, isMockMode } from "@/lib/firebase";
import { Maximize2, Minimize2, X, Shield, CheckCircle, AlertTriangle, Flame } from "lucide-react";

function MapEvents({ setZoom }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    }
  });
  return null;
}

export default function MapClient() {
  const MIN_POLYGON_THRESHOLD = 100;
  const [reports, setReports] = useState([]);
  const [icons, setIcons] = useState({ red: null, grey: null });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(2);
  const [selectedReport, setSelectedReport] = useState(null);

  const truncateWords = (str, numWords = 30) => {
    if (!str) return "";
    const words = str.split(/\s+/);
    if (words.length <= numWords) return str;
    return words.slice(0, numWords).join(" ") + "...";
  };

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
  const globalStats = { total: 0, verified: 0, ignored: 0, heatmap: 0 };
  
  reports.forEach(report => {
    globalStats.total++;
    if (report.status === "PUBLIC_VERIFIED") globalStats.verified++;
    if (report.status === "ACTION_IGNORED") globalStats.ignored++;
    if (report.status === "HEATMAP_AGGREGATED") globalStats.heatmap++;

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
    
    if (!stats || stats.total < MIN_POLYGON_THRESHOLD) {
      return { fillColor: "transparent", color: "transparent", weight: 0, opacity: 0, fillOpacity: 0 };
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

    return { fillColor, color: "#94a3b8", weight: 1, opacity: 0.8, fillOpacity: 0.4 };
  };

  const onEachFeature = (feature, layer) => {
    const countryName = feature.properties.name;
    const stats = countryStats[countryName];
    if (stats && stats.total >= MIN_POLYGON_THRESHOLD) {
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
    ? "fixed inset-0 z-50 bg-slate-950 p-0 sm:p-4 flex flex-col"
    : "relative w-full h-[50vh] min-h-[450px] md:h-[700px] rounded-xl overflow-hidden shadow-2xl border border-slate-700 z-10";

  return (
    <div className={containerClasses}>
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-[400] bg-slate-900/80 hover:bg-indigo-600 text-white p-2 rounded-lg backdrop-blur shadow border border-slate-700 transition-colors pointer-events-auto"
        title="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      <div className="absolute bottom-6 left-4 z-[400] bg-slate-900/80 backdrop-blur text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-slate-700 shadow-lg pointer-events-none text-slate-200">
        <div className="flex items-center gap-2 mb-2"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span> Public Verified</div>
        <div className="flex items-center gap-2 mb-2"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.8)]"></span> Action Ignored</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-500 opacity-80 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span> Heatmap Aggregated</div>
      </div>

      <div className="absolute top-2 left-1/2 -translate-x-1/2 md:top-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2 z-[400] bg-slate-900/90 backdrop-blur-md text-[10px] sm:text-sm px-2 py-1.5 sm:px-6 sm:py-3 rounded-md md:rounded-full border border-slate-800 shadow-xl pointer-events-none text-slate-200 flex flex-wrap justify-center w-[92%] md:w-auto items-center gap-2 md:gap-6">
        <div className="flex items-center gap-1 sm:gap-2 font-bold"><Shield size={12} className="text-indigo-400 sm:w-4 sm:h-4"/> <span className="hidden sm:inline">Total Incidents:</span><span className="sm:hidden">Total:</span> {globalStats.total}</div>
        <div className="w-px h-4 bg-slate-700 hidden sm:block"></div>
        <div className="flex items-center gap-1 sm:gap-2"><CheckCircle size={12} className="text-red-500 sm:w-4 sm:h-4"/> Verified: {globalStats.verified}</div>
        <div className="flex items-center gap-1 sm:gap-2"><AlertTriangle size={12} className="text-slate-400 sm:w-4 sm:h-4"/> Ignored: {globalStats.ignored}</div>
        <div className="flex items-center gap-1 sm:gap-2"><Flame size={12} className="text-orange-500 sm:w-4 sm:h-4"/> Heatmaps: {globalStats.heatmap}</div>
      </div>

      <MapContainer 
        center={[20, 0]} 
        zoom={2}
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true} 
        preferCanvas={true}
        attributionControl={false}
        zoomControl={false}
        className="w-full h-full rounded-xl z-0"
        style={{ height: "100%", width: "100%", backgroundColor: "#aad3df" }} // Matches OSM water color
      >
        <ZoomControl position="bottomright" />
        <MapEvents setZoom={setCurrentZoom} />
        <TileLayer
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

        <MarkerClusterGroup chunkedLoading>
          {reports.map((report) => {
            const country = report.country;
            const regionTotal = countryStats[country]?.total || 0;
            const isBelowThreshold = regionTotal < MIN_POLYGON_THRESHOLD;
            
            // Hide individual markers if zoomed out AND region meets polygon threshold
            if (currentZoom < 8 && !isBelowThreshold) {
              return null;
            }

            if (report.status === "PUBLIC_VERIFIED" && report.lat && report.lng && icons.red) {
              return (
                <Marker key={report.id} position={[report.lat, report.lng]} icon={icons.red}>
                  <Popup>
                    <div className="text-slate-900 min-w-[250px] max-w-[320px]">
                      <h3 className="font-bold text-lg mb-1 break-words">{report.facilityName || "Verified Incident"}</h3>
                      <p className="text-sm font-semibold text-red-600 mb-2 break-words">{report.category}</p>
                      <p className="text-sm mb-3 break-words whitespace-pre-wrap">{truncateWords(report.summary)}</p>
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded transition-colors"
                      >
                        Read Full Report
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            } else if (report.status === "ACTION_IGNORED" && report.lat && report.lng && icons.grey) {
              return (
                <Marker key={report.id} position={[report.lat, report.lng]} icon={icons.grey}>
                  <Popup>
                    <div className="text-slate-900 min-w-[250px] max-w-[320px]">
                      <div className="inline-block bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded mb-2 uppercase tracking-wide">
                        Action Ignored
                      </div>
                      <h3 className="font-bold text-lg mb-1 break-words">{report.facilityName || "Incident"}</h3>
                      <p className="text-sm font-semibold text-slate-600 mb-2 break-words">{report.category}</p>
                      <p className="text-sm mb-3 break-words whitespace-pre-wrap">{truncateWords(report.summary)}</p>
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded transition-colors"
                      >
                        Read Full Report
                      </button>
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
      </MapContainer>

      {/* Full Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative text-left">
            <button 
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="mb-6 pr-8">
              {selectedReport.status === "ACTION_IGNORED" && (
                <div className="inline-block bg-slate-700 text-slate-200 text-xs font-bold px-2 py-1 rounded mb-3 uppercase tracking-wide">
                  Action Ignored
                </div>
              )}
              {selectedReport.status === "PUBLIC_VERIFIED" && (
                <div className="inline-block bg-red-900/50 text-red-400 text-xs font-bold px-2 py-1 rounded mb-3 uppercase tracking-wide">
                  Verified Incident
                </div>
              )}
              <h2 className="text-2xl font-bold text-white mb-1">{selectedReport.facilityName || "Incident Report"}</h2>
              <p className="text-indigo-400 font-semibold">{selectedReport.category}</p>
              <p className="text-slate-400 text-sm mt-1">{selectedReport.region}, {selectedReport.country}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Experience Summary</h3>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                {selectedReport.summary ? selectedReport.summary.replace(/([^\n])\n([^\n])/g, '$1 $2') : ""}
              </div>
            </div>

            {selectedReport.status === "ACTION_IGNORED" && (
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Institutional Response</h3>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.authorityDetails ? selectedReport.authorityDetails.replace(/([^\n])\n([^\n])/g, '$1 $2') : "Reported to authorities. No action taken."}
                </p>
              </div>
            )}

            {selectedReport.evidenceLinks && selectedReport.evidenceLinks.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Public Evidence Links</h3>
                <ul className="list-disc pl-4 space-y-2">
                  {selectedReport.evidenceLinks.map((link, i) => (
                    <li key={i}>
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline break-all">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
