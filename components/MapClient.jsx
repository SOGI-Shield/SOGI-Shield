"use client";
import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, GeoJSON, useMapEvents, useMap, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from "leaflet";
import { collection, getDocs, query } from "firebase/firestore/lite";
import { db, isMockMode } from "@/lib/firebase";
import { isValidWebUrl } from "@/lib/utils";
import { 
  Maximize2, 
  Minimize2, 
  X, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Flame, 
  Loader2,
  Search,
  Building2,
  MapPin,
  Layers,
  Globe
} from "lucide-react";

function MapEvents({ setZoom }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    }
  });
  return null;
}

function MapController({ focusTarget }) {
  const map = useMap();
  useEffect(() => {
    if (focusTarget && typeof focusTarget.lat === "number" && typeof focusTarget.lng === "number") {
      map.flyTo([focusTarget.lat, focusTarget.lng], focusTarget.zoom || 11, {
        duration: 1.2
      });
    }
  }, [focusTarget, map]);
  return null;
}

function MapUrlSync() {
  const map = useMap();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const lat = parseFloat(params.get("lat"));
      const lng = parseFloat(params.get("lng"));
      const zoom = parseInt(params.get("zoom"), 10) || 10;
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], zoom, { animate: true });
      }
    }
  }, [map]);
  return null;
}

export default function MapClient() {
  const MIN_POLYGON_THRESHOLD = 100;
  const [reports, setReports] = useState([]);
  const [icons] = useState(() => {
    if (typeof window === "undefined" || !L || !L.Icon) {
      return { red: null, grey: null };
    }
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

    return { red: redIcon, grey: greyIcon };
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [citiesData, setCitiesData] = useState(null);
  const [districtsData, setDistrictsData] = useState(null);
  const [activeLayer, setActiveLayer] = useState("all"); // 'all' | 'countries' | 'districts' | 'cities'
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [focusTarget, setFocusTarget] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(2);
  const [selectedReport, setSelectedReport] = useState(null);

  const truncateWords = (str, numWords = 8) => {
    if (!str) return "";
    const words = str.split(/\s+/);
    if (words.length <= numWords) return str;
    return words.slice(0, numWords).join(" ") + "...";
  };

  useEffect(() => {
    fetch('/countries.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Failed to load country geojson", err));

    fetch('/cities.geojson')
      .then(res => res.json())
      .then(data => setCitiesData(data))
      .catch(err => console.error("Failed to load cities geojson", err));

    fetch('/districts.geojson')
      .then(res => res.json())
      .then(data => setDistrictsData(data))
      .catch(err => console.error("Failed to load districts geojson", err));
  }, []);

  const searchResults = useMemo(() => {
    if (!citiesData?.features || !citySearchQuery.trim()) return [];
    const q = citySearchQuery.toLowerCase().trim();
    return citiesData.features
      .filter(f => {
        const name = (f.properties?.name || "").toLowerCase();
        const country = (f.properties?.country || "").toLowerCase();
        const district = (f.properties?.district || "").toLowerCase();
        const plusCode = (f.properties?.plusCode || "").toLowerCase();
        return name.includes(q) || country.includes(q) || district.includes(q) || plusCode.includes(q);
      })
      .slice(0, 6);
  }, [citiesData, citySearchQuery]);

  const styleDistrictFeature = () => ({
    fillColor: "#6366f1",
    color: "#818cf8",
    weight: 1.5,
    opacity: 0.6,
    dashArray: "4, 4",
    fillOpacity: 0.05
  });

  const onEachDistrictFeature = (feature, layer) => {
    const p = feature.properties || {};
    const label = `
      <div style="font-family: sans-serif; color: #0f172a;">
        <div style="font-weight: bold; font-size: 13px;">${p.name || "District"}</div>
        <div style="font-size: 11px; color: #475569;">${[p.type, p.region, p.country].filter(Boolean).join(" • ")}</div>
      </div>
    `;
    layer.bindTooltip(label, { sticky: true });
  };

  const [isLoadingReports, setIsLoadingReports] = useState(() => isMockMode || Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY));

  useEffect(() => {
    if (isMockMode) {
      import('@/src/data/mockReports.json').then(m => {
        const staticReports = m.default || m;
        import('@/lib/localStore').then(({ getLocalReports }) => {
          const localReports = getLocalReports();
          const combined = [
            ...localReports,
            ...staticReports.filter(s => !localReports.some(l => l.id === s.id))
          ];
          setReports(combined);
          setIsLoadingReports(false);
        }).catch(() => {
          setReports(staticReports);
          setIsLoadingReports(false);
        });
      }).catch(e => {
        console.error("Failed to load mock reports:", e);
        setIsLoadingReports(false);
      });
      return;
    }

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here') {
      const q = query(collection(db, "reports"));
      const fetchReports = async () => {
        try {
          const snapshot = await getDocs(q);
          const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReports(fetched);
        } catch (e) {
          console.error("Failed to fetch reports:", e);
        } finally {
          setIsLoadingReports(false);
        }
      };
      
      fetchReports();
      // Optional polling every 60s
      const interval = setInterval(fetchReports, 60000);
      return () => clearInterval(interval);
    } else {
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
    ? "fixed inset-0 z-[1000] bg-slate-950 p-0 sm:p-4 flex flex-col"
    : "relative w-full h-[50vh] min-h-[450px] md:h-[700px] rounded-xl overflow-hidden shadow-2xl border border-slate-700 z-10";

  return (
    <div className={containerClasses}>
      {/* Fullscreen Toggle (enabled on all screen sizes with 44px touch target) */}
      <button 
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[400] bg-slate-900/90 hover:bg-indigo-600 active:bg-indigo-700 text-white min-w-[44px] min-h-[44px] p-2.5 rounded-xl backdrop-blur-md shadow-lg border border-slate-700/80 transition-all pointer-events-auto flex items-center justify-center cursor-pointer"
        title="Toggle Fullscreen"
        aria-label="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      {/* Loading Indicator */}
      {isLoadingReports && (
        <div className="absolute top-16 right-3 sm:top-16 sm:right-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold text-cyan-300 shadow-lg flex items-center gap-1.5 sm:gap-2 pointer-events-none animate-pulse">
          <Loader2 size={12} className="animate-spin text-cyan-400" />
          <span>Syncing pins...</span>
        </div>
      )}

      {/* City & District Search + Layer Controls (Natural Earth & GeoNames) */}
      <div className="absolute top-12 left-3 sm:top-4 sm:left-4 z-[400] flex flex-col gap-2 max-w-[calc(100%-60px)] sm:max-w-xs">
        <div className="relative">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 flex items-center gap-2 shadow-xl">
            <Search size={14} className="text-cyan-400 shrink-0" />
            <input
              type="text"
              value={citySearchQuery}
              onChange={(e) => setCitySearchQuery(e.target.value)}
              placeholder="Search 1,200+ cities & districts..."
              className="bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none w-full"
            />
            {citySearchQuery && (
              <button
                onClick={() => setCitySearchQuery("")}
                className="text-slate-400 hover:text-white p-0.5 rounded-full cursor-pointer"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 w-full bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 text-left">
              <div className="p-1.5 text-[10px] font-bold text-slate-400 border-b border-white/5 uppercase tracking-wider flex items-center justify-between">
                <span>Natural Earth & GeoNames</span>
                <span>{searchResults.length} matches</span>
              </div>
              {searchResults.map((city) => {
                const [lng, lat] = city.geometry.coordinates;
                return (
                  <button
                    key={city.id || `${lat}-${lng}`}
                    onClick={() => {
                      setFocusTarget({ lat, lng, zoom: 11, name: city.properties.name });
                      setCitySearchQuery("");
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-800 active:bg-slate-700 border-b border-white/5 last:border-0 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                        {city.properties.name}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/20">
                        {city.properties.plusCode?.slice(0, 8)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {[city.properties.district, city.properties.country].filter(Boolean).join(", ")}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Layer Filter Buttons */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 shadow-lg text-[10px] font-bold text-slate-300 w-fit">
          <button
            onClick={() => setActiveLayer("all")}
            className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              activeLayer === "all" ? "bg-indigo-600 text-white" : "hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveLayer("countries")}
            className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              activeLayer === "countries" ? "bg-indigo-600 text-white" : "hover:text-white"
            }`}
          >
            Countries
          </button>
          <button
            onClick={() => setActiveLayer("districts")}
            className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              activeLayer === "districts" ? "bg-indigo-600 text-white" : "hover:text-white"
            }`}
          >
            Districts
          </button>
          <button
            onClick={() => setActiveLayer("cities")}
            className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              activeLayer === "cities" ? "bg-indigo-600 text-white" : "hover:text-white"
            }`}
          >
            Cities
          </button>
        </div>
      </div>

      {/* Incident Status Legend */}
      <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-4 z-[400] bg-slate-900/90 backdrop-blur-md text-[10px] sm:text-xs px-2.5 py-2 sm:px-4 sm:py-3 rounded-xl border border-slate-700/80 shadow-lg pointer-events-none text-slate-200 flex flex-col gap-1 sm:gap-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span> Public Verified</div>
        <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.8)]"></span> Action Ignored</div>
        <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 opacity-80 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span> Heatmap Aggregated</div>
      </div>

      {/* Global Incident Stats HUD */}
      <div className="absolute top-3 left-3 sm:top-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 z-[400] bg-slate-900/90 backdrop-blur-md text-[10px] sm:text-sm px-2.5 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-full border border-slate-800 shadow-xl pointer-events-none text-slate-200 flex flex-wrap justify-center max-w-[calc(100%-68px)] sm:max-w-none items-center gap-1.5 sm:gap-6">
        <div className="flex items-center gap-1 sm:gap-2 font-bold"><Shield size={12} className="text-indigo-400 sm:w-4 sm:h-4"/> <span className="hidden sm:inline">Total Incidents:</span><span className="sm:hidden">Total:</span> {globalStats.total}</div>
        <div className="w-px h-4 bg-slate-700 hidden sm:block"></div>
        <div className="flex items-center gap-1 sm:gap-2"><CheckCircle size={12} className="text-red-500 sm:w-4 sm:h-4"/> Verified: {globalStats.verified}</div>
        <div className="flex items-center gap-1 sm:gap-2"><AlertTriangle size={12} className="text-slate-400 sm:w-4 sm:h-4"/> Ignored: {globalStats.ignored}</div>
        <div className="flex items-center gap-1 sm:gap-2"><Flame size={12} className="text-orange-500 sm:w-4 sm:h-4"/> Heatmaps: {globalStats.heatmap}</div>
      </div>

      {/* Open-Source GeoJSON Attribution */}
      <div className="absolute bottom-3 right-12 z-[400] bg-slate-900/80 backdrop-blur-md text-[9px] px-2 py-1 rounded-md border border-slate-800 text-slate-400 pointer-events-none hidden sm:block">
        Natural Earth & GeoNames Open GeoJSON
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
        <MapController focusTarget={focusTarget} />
        <MapUrlSync />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
          noWrap={true}
        />
        
        {/* Country Polygons (Risk & Incidents) */}
        {(activeLayer === "all" || activeLayer === "countries") && currentZoom < 8 && geoData && (
          <GeoJSON 
            data={geoData} 
            style={styleFeature} 
            onEachFeature={onEachFeature} 
            key={JSON.stringify(countryStats)}
          />
        )}

        {/* Open-Source Districts & Provinces (Natural Earth Admin-1) */}
        {(activeLayer === "all" || activeLayer === "districts") && districtsData && currentZoom < 9 && (
          <GeoJSON
            data={districtsData}
            style={styleDistrictFeature}
            onEachFeature={onEachDistrictFeature}
            key="districts-open-layer"
          />
        )}

        {/* Open-Source Cities & Populated Places (Natural Earth & GeoNames) */}
        {(activeLayer === "all" || activeLayer === "cities") && citiesData?.features && (
          citiesData.features.map((city) => {
            const [lng, lat] = city.geometry.coordinates;
            const isCapital = city.properties.type?.toLowerCase().includes("capital");
            // At zoom < 4 only show national capitals; at zoom >= 4 show all cities
            if (currentZoom < 4 && !isCapital) return null;

            return (
              <CircleMarker
                key={city.id || `${lat}-${lng}`}
                center={[lat, lng]}
                radius={currentZoom >= 7 ? 6 : (isCapital ? 5 : 3.5)}
                pathOptions={{
                  fillColor: isCapital ? "#06b6d4" : "#6366f1",
                  color: "#ffffff",
                  weight: 1,
                  opacity: 0.9,
                  fillOpacity: 0.85
                }}
              >
                <Popup>
                  <div className="text-slate-900 w-full max-w-[240px]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                      <Building2 size={12} />
                      <span>{city.properties.type || "Populated Place"}</span>
                    </div>
                    <h3 className="font-bold text-base text-slate-950 mb-0.5">{city.properties.name}</h3>
                    <p className="text-xs text-slate-600 mb-2">
                      {[city.properties.district, city.properties.country].filter(Boolean).join(", ")}
                    </p>
                    <div className="bg-slate-100 rounded-lg p-2 text-xs mb-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Sector Code:</span>
                        <span className="font-mono font-bold text-slate-800">{city.properties.plusCode || "N/A"}</span>
                      </div>
                      {city.properties.population > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Population:</span>
                          <span className="font-bold text-slate-700">{Number(city.properties.population).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setFocusTarget({ lat, lng, zoom: 12 })}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <MapPin size={12} />
                      <span>Focus City Sector</span>
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })
        )}

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
        >
          {reports.map((report) => {
            if (report.status === "PUBLIC_VERIFIED" && report.lat && report.lng && icons.red) {
              return (
                <Marker key={report.id} position={[Number(report.lat), Number(report.lng)]} icon={icons.red}>
                  <Popup>
                    <div className="text-slate-900 w-full max-w-[260px]">
                      <h3 className="font-bold text-lg mb-1 break-words">{report.facilityName || "Verified Incident"}</h3>
                      <p className="text-sm font-semibold text-red-600 mb-2 break-words">{report.category}</p>
                      <p className="text-sm mb-3 break-words whitespace-pre-wrap">{truncateWords(report.summary)}</p>
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 text-xs font-bold py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                      >
                        Read Full Report
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            } else if (report.status === "ACTION_IGNORED" && report.lat && report.lng && icons.grey) {
              return (
                <Marker key={report.id} position={[Number(report.lat), Number(report.lng)]} icon={icons.grey}>
                  <Popup>
                    <div className="text-slate-900 w-full max-w-[260px]">
                      <div className="inline-block bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded mb-2 uppercase tracking-wide">
                        Action Ignored
                      </div>
                      <h3 className="font-bold text-lg mb-1 break-words">{report.facilityName || "Incident"}</h3>
                      <p className="text-sm font-semibold text-slate-600 mb-2 break-words">{report.category}</p>
                      <p className="text-sm mb-3 break-words whitespace-pre-wrap">{truncateWords(report.summary)}</p>
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 text-xs font-bold py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-sm"
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
                  center={[Number(report.lat), Number(report.lng)]}
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
        <div className="fixed inset-0 z-[1050] bg-slate-950/80 backdrop-blur flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative text-left">
            <button 
              onClick={() => setSelectedReport(null)}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 min-w-[44px] min-h-[44px] p-2 text-slate-400 hover:text-white active:bg-slate-800 rounded-full transition-colors flex items-center justify-center"
              aria-label="Close report details"
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
                  {selectedReport.evidenceLinks.map((link, i) => {
                    const isSafe = isValidWebUrl(link);
                    return (
                      <li key={i}>
                        {isSafe ? (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline break-all">
                            {link}
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs break-all">
                            {link}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
