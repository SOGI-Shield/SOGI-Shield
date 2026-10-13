"use client";
import { useEffect, useState, useMemo, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, GeoJSON, useMapEvents, useMap, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from "leaflet";
import { isValidWebUrl } from "@/lib/utils";
import { getGeoJson } from "@/lib/geoDataService";
import { subscribeReports, fetchAllReports, initBackgroundPoller } from "@/lib/reportsCache";
import { decompressReport } from "@/lib/compress";
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
  ChevronDown,
  Info,
  Calendar,
  ExternalLink
} from "lucide-react";

function MapEvents({ setZoom, setBounds }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
      setBounds(map.getBounds());
    },
    moveend: () => {
      setBounds(map.getBounds());
    }
  });

  useEffect(() => {
    setBounds(map.getBounds());
  }, [map, setBounds]);

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
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [icons] = useState(() => {
    if (typeof window === "undefined" || !L || !L.divIcon) {
      return { coral: null, grey: null };
    }

    // High-contrast, custom-rendered Coral Rose pin for verified incident facilities
    const coralIcon = L.divIcon({
      className: "custom-coral-pin",
      html: `
        <div style="position: relative; width: 30px; height: 38px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 26px; height: 26px; border-radius: 50% 50% 50% 0; background: #FB4E77; transform: rotate(-45deg); box-shadow: 0 0 15px rgba(251, 78, 119, 0.7); border: 2px solid #ffffff;"></div>
          <div style="position: absolute; width: 10px; height: 10px; border-radius: 50%; background: #ffffff; top: 8px;"></div>
        </div>
      `,
      iconSize: [30, 38],
      iconAnchor: [15, 38],
      popupAnchor: [0, -36],
    });

    // High-contrast Iris/Slate pin for Action Ignored
    const greyIcon = L.divIcon({
      className: "custom-grey-pin",
      html: `
        <div style="position: relative; width: 30px; height: 38px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 26px; height: 26px; border-radius: 50% 50% 50% 0; background: #584BE0; transform: rotate(-45deg); box-shadow: 0 0 12px rgba(88, 75, 224, 0.5); border: 2px solid #ffffff;"></div>
          <div style="position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #ffffff; top: 9px;"></div>
        </div>
      `,
      iconSize: [30, 38],
      iconAnchor: [15, 38],
      popupAnchor: [0, -36],
    });

    return { coral: coralIcon, grey: greyIcon };
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [citiesData, setCitiesData] = useState(null);
  const [districtsData, setDistrictsData] = useState(null);
  const [activeLayer, setActiveLayer] = useState("all"); // 'all' | 'countries' | 'districts' | 'cities'
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [focusTarget, setFocusTarget] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(2);
  const [mapBounds, setMapBounds] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (!selectedReport) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedReport(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedReport]);

  const handleOpenReportDetails = async (report) => {
    if (!report) return;
    if (report.c_data && !report._isDecompressed) {
      const decompressed = await decompressReport(report);
      setSelectedReport(decompressed);
    } else {
      setSelectedReport(report);
    }
  };

  const truncateWords = (str, numWords = 8) => {
    if (!str) return "";
    const words = str.split(/\s+/);
    if (words.length <= numWords) return str;
    return words.slice(0, numWords).join(" ") + "...";
  };

  // Progressive GeoJSON Loading: Countries first, cities and districts deferred for slow networks
  useEffect(() => {
    // 1. Countries GeoJSON (priority for base polygons)
    getGeoJson('/countries.geojson').then(data => {
      if (data) setGeoData(data);
    });

    // 2. Cities & Districts deferred slightly to prioritize map tile loading and UI responsiveness
    const timer = setTimeout(() => {
      getGeoJson('/cities.geojson').then(data => {
        if (data) setCitiesData(data);
      });
      getGeoJson('/districts.geojson').then(data => {
        if (data) setDistrictsData(data);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  // Shared Reports Synchronization
  useEffect(() => {
    initBackgroundPoller();
    const unsubscribe = subscribeReports((allReports) => {
      setReports(allReports);
      setIsLoadingReports(false);
    });
    fetchAllReports().then(() => {
      setIsLoadingReports(false);
    });
    return () => unsubscribe();
  }, []);

  // Fast client-side city search across all 1,249 features in memory
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

  // Viewport Bounding Box & Zoom-Tiered City LOD Culling
  // Drastically cuts React DOM reconciliation down from 1,249 markers to max 60 markers!
  const visibleCities = useMemo(() => {
    if (!citiesData?.features) return [];
    if (activeLayer !== "all" && activeLayer !== "cities") return [];

    // Global / World View (zoom 2): show top national capitals only
    if (currentZoom < 3) {
      return citiesData.features
        .filter(c => c.properties?.type?.toLowerCase().includes("capital") && (c.properties?.population || 0) >= 1000000)
        .slice(0, 30);
    }

    // Continental View (zoom 3-4): show capitals + top metropolitan centers
    if (currentZoom < 5) {
      return citiesData.features
        .filter(c => {
          const isCapital = c.properties?.type?.toLowerCase().includes("capital");
          const pop = c.properties?.population || 0;
          return isCapital || pop >= 1500000;
        })
        .slice(0, 50);
    }

    // Viewport-based culling when zoomed into countries/regions
    if (!mapBounds) {
      return citiesData.features.slice(0, 40);
    }

    const south = mapBounds.getSouth() - 0.2;
    const north = mapBounds.getNorth() + 0.2;
    const west = mapBounds.getWest() - 0.2;
    const east = mapBounds.getEast() + 0.2;

    const inBounds = citiesData.features.filter(c => {
      const [lng, lat] = c.geometry.coordinates;
      return lat >= south && lat <= north && lng >= west && lng <= east;
    });

    if (currentZoom < 8) {
      return inBounds
        .sort((a, b) => (b.properties?.population || 0) - (a.properties?.population || 0))
        .slice(0, 55);
    }

    // High zoom local metropolitan view
    return inBounds.slice(0, 60);
  }, [citiesData, activeLayer, currentZoom, mapBounds]);

  const styleDistrictFeature = () => ({
    fillColor: "#584BE0",
    color: "#584BE0",
    weight: 1.5,
    opacity: 0.7,
    dashArray: "4, 4",
    fillOpacity: 0.08
  });

  const onEachDistrictFeature = useCallback((feature, layer) => {
    const p = feature.properties || {};
    const label = `
      <div style="font-family: sans-serif; color: #0f172a;">
        <div style="font-weight: bold; font-size: 13px;">${p.name || "District"}</div>
        <div style="font-size: 11px; color: #475569;">${[p.type, p.region, p.country].filter(Boolean).join(" • ")}</div>
      </div>
    `;
    layer.bindTooltip(label, { sticky: true });
  }, []);

  const { countryStats, globalStats } = useMemo(() => {
    const cStats = {};
    const gStats = { total: 0, verified: 0, ignored: 0, heatmap: 0 };

    reports.forEach(report => {
      gStats.total++;
      if (report.status === "PUBLIC_VERIFIED") gStats.verified++;
      if (report.status === "ACTION_IGNORED") gStats.ignored++;
      if (report.status === "HEATMAP_AGGREGATED") gStats.heatmap++;

      const country = report.country;
      if (!country) return;
      if (!cStats[country]) {
        cStats[country] = { verified: 0, ignored: 0, aggregated: 0, total: 0 };
      }
      cStats[country].total++;
      if (report.status === "PUBLIC_VERIFIED") cStats[country].verified++;
      if (report.status === "ACTION_IGNORED") cStats[country].ignored++;
      if (report.status === "HEATMAP_AGGREGATED") cStats[country].aggregated++;
    });

    return { countryStats: cStats, globalStats: gStats };
  }, [reports]);

  const styleFeature = useCallback((feature) => {
    const countryName = feature.properties.name;
    const stats = countryStats[countryName];
    
    if (!stats || stats.total < MIN_POLYGON_THRESHOLD) {
      return { fillColor: "transparent", color: "transparent", weight: 0, opacity: 0, fillOpacity: 0 };
    }

    let fillColor = "#00D99D"; // Vivid Mint for safe density aggregation
    if (stats.ignored > stats.verified) {
      fillColor = "#584BE0"; // Electric Iris for neglected/ignored
    } else if (stats.total >= 50) {
      fillColor = "#FB4E77"; // Coral Rose for high verified violations
    }

    return {
      fillColor: fillColor,
      weight: 1.5,
      opacity: 0.85,
      color: "#ffffff",
      fillOpacity: 0.4
    };
  }, [countryStats]);

  const onEachFeature = useCallback((feature, layer) => {
    const countryName = feature.properties.name;
    const stats = countryStats[countryName];
    
    if (stats && stats.total >= MIN_POLYGON_THRESHOLD) {
      const tooltipContent = `
        <div style="font-family: sans-serif; color: #000; min-width: 140px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${countryName}</div>
          <div style="font-size: 12px; margin-bottom: 2px;">Total Incidents: <b>${stats.total}</b></div>
          <div style="font-size: 12px; color: #FB4E77; margin-bottom: 2px;">Verified: <b>${stats.verified}</b></div>
          <div style="font-size: 12px; color: #584BE0; margin-bottom: 2px;">Ignored: <b>${stats.ignored}</b></div>
          <div style="font-size: 12px; color: #00D99D;">Heatmap Aggregated: <b>${stats.aggregated}</b></div>
        </div>
      `;
      layer.bindTooltip(tooltipContent, { sticky: true });
    }
  }, [countryStats]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-[1000] bg-slate-950 p-0 sm:p-4 flex flex-col"
    : "relative w-full h-[55vh] min-h-[460px] md:h-[720px] rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 z-10";

  return (
    <div className={containerClasses}>
      {/* Top Floating Utility Bar (Anti-Clutter, Mobile-Optimized) */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-[400] flex items-center justify-between gap-2 pointer-events-none">
        {/* Search + Layer Controls Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto flex-1 max-w-sm sm:max-w-md">
          <div className="relative flex-1">
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-2 shadow-xl">
              <Search size={14} className="text-mint shrink-0" />
              <input
                type="text"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                placeholder="Search 1,200+ cities & grids..."
                className="bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none w-full"
              />
              {citySearchQuery && (
                <button
                  onClick={() => setCitySearchQuery("")}
                  className="text-slate-400 hover:text-white p-0.5 rounded-full cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Instant City Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 w-full bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 text-left">
                <div className="p-1.5 text-[10px] font-bold text-slate-400 border-b border-white/5 uppercase tracking-wider flex items-center justify-between">
                  <span>Natural Earth & GeoNames</span>
                  <span>{searchResults.length} matches</span>
                </div>
                {searchResults.map((city, idx) => {
                  const [lng, lat] = city.geometry.coordinates;
                  return (
                    <button
                      key={`search-city-${city.id || idx}-${lat}-${lng}-${idx}`}
                      onClick={() => {
                        setFocusTarget({ lat, lng, zoom: 11, name: city.properties.name });
                        setCitySearchQuery("");
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-800 active:bg-slate-700 border-b border-white/5 last:border-0 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-mint">
                          {city.properties.name}
                        </span>
                        <span className="text-[10px] font-mono text-mint bg-mint/15 px-1.5 py-0.5 rounded border border-mint/30">
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

          {/* Collapsible Layer Toggle Pill */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-700/90 text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all cursor-pointer min-h-[36px]"
              title="Toggle Map Layers"
              aria-label="Toggle Map Layers"
            >
              <Layers size={13} className="text-iris" />
              <span className="hidden sm:inline capitalize">{activeLayer}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${showLayerMenu ? "rotate-180" : ""}`} />
            </button>

            {showLayerMenu && (
              <div className="absolute top-full mt-1.5 right-0 sm:left-0 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 z-50 min-w-[120px]">
                {["all", "countries", "districts", "cities"].map((layer) => (
                  <button
                    key={`layer-opt-${layer}`}
                    onClick={() => {
                      setActiveLayer(layer);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      activeLayer === layer ? "bg-iris text-white font-bold" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Toolbar: Sync Status + Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {isLoadingReports && (
            <div className="bg-slate-900/90 backdrop-blur-md border border-mint/40 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-mint shadow-lg flex items-center gap-1.5 animate-pulse">
              <Loader2 size={12} className="animate-spin text-mint" />
              <span className="hidden sm:inline">Syncing...</span>
            </div>
          )}

          <button 
            onClick={toggleFullscreen}
            className="bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-iris-400 hover:border-iris/50 active:scale-95 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] p-2 rounded-xl backdrop-blur-md shadow-lg border border-slate-700/90 transition-all flex items-center justify-center cursor-pointer"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Floating Global Incident Stats HUD (Centered, Non-Obtrusive) */}
      <div className="absolute bottom-14 left-3 right-3 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-[400] bg-slate-950/90 backdrop-blur-md text-[10px] sm:text-xs px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-full border border-white/10 shadow-2xl pointer-events-none text-slate-200 flex items-center justify-between sm:justify-center gap-2 sm:gap-5">
        <div className="flex items-center gap-1 font-bold">
          <Shield size={12} className="text-slate-400" />
          <span className="hidden sm:inline">Incidents:</span>
          <span>{globalStats.total}</span>
        </div>
        <div className="w-px h-3 bg-slate-700 hidden sm:block"></div>
        <div className="flex items-center gap-1 text-coral font-semibold">
          <CheckCircle size={12} className="text-coral" />
          <span className="hidden sm:inline">Verified:</span>
          <span>{globalStats.verified}</span>
        </div>
        <div className="w-px h-3 bg-slate-700 hidden sm:block"></div>
        <div className="flex items-center gap-1 text-iris-400 font-semibold">
          <AlertTriangle size={12} className="text-iris-400" />
          <span className="hidden sm:inline">Ignored:</span>
          <span>{globalStats.ignored}</span>
        </div>
        <div className="w-px h-3 bg-slate-700 hidden sm:block"></div>
        <div className="flex items-center gap-1 text-mint font-semibold">
          <Flame size={12} className="text-mint" />
          <span className="hidden sm:inline">Heatmaps:</span>
          <span>{globalStats.heatmap}</span>
        </div>
      </div>

      {/* Collapsible Incident Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-[400] flex flex-col items-start gap-1">
        {showLegend && (
          <div className="bg-slate-950/95 backdrop-blur-md text-[10px] sm:text-xs px-3 py-2 rounded-xl border border-white/15 shadow-2xl text-slate-200 flex flex-col gap-1.5 mb-1 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-coral shadow-[0_0_8px_rgba(251,78,119,0.8)]"></span>
              <span>Public Verified (#FB4E77)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-iris shadow-[0_0_8px_rgba(88,75,224,0.8)]"></span>
              <span>Action Ignored (#584BE0)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-mint shadow-[0_0_8px_rgba(0,217,157,0.8)]"></span>
              <span>Heatmap Aggregated (#00D99D)</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700/80 text-[10px] font-bold flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
          title="Toggle Map Legend"
          aria-label="Toggle Map Legend"
        >
          <Info size={11} className="text-mint" />
          <span>Legend</span>
        </button>
      </div>

      {/* Main High-Performance Leaflet Canvas Container */}
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
        style={{ height: "100%", width: "100%", backgroundColor: "#aad3df" }}
      >
        <ZoomControl position="bottomright" />
        <MapEvents setZoom={setCurrentZoom} setBounds={setMapBounds} />
        <MapController focusTarget={focusTarget} />
        <MapUrlSync />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
          noWrap={true}
          keepBuffer={2}
          updateWhenIdle={true}
          updateWhenZooming={false}
          maxNativeZoom={18}
          minZoom={2}
        />
        
        {/* Country Polygons (Risk & Incidents) */}
        {(activeLayer === "all" || activeLayer === "countries") && currentZoom < 8 && geoData && (
          <GeoJSON 
            data={geoData} 
            style={styleFeature} 
            onEachFeature={onEachFeature} 
            key={`countries-layer-${Object.keys(countryStats).length}`}
          />
        )}

        {/* Open-Source Districts & Provinces (Natural Earth Admin-1) */}
        {(activeLayer === "all" || activeLayer === "districts") && districtsData && currentZoom < 9 && (
          <GeoJSON
            data={districtsData}
            style={styleDistrictFeature}
            onEachFeature={onEachDistrictFeature}
            key={`districts-layer-${districtsData?.features?.length || 0}`}
          />
        )}

        {/* Dynamic LOD Viewport-Culled Populated Cities (Max ~60 rendered markers) */}
        {visibleCities.map((city, idx) => {
          const [lng, lat] = city.geometry.coordinates;
          const isCapital = city.properties.type?.toLowerCase().includes("capital");

          return (
            <CircleMarker
              key={`city-marker-${city.id || idx}-${lat}-${lng}-${idx}`}
              center={[lat, lng]}
              radius={currentZoom >= 7 ? 6 : (isCapital ? 5 : 3.5)}
              pathOptions={{
                fillColor: isCapital ? "#00D99D" : "#584BE0",
                color: "#ffffff",
                weight: 1,
                opacity: 0.95,
                fillOpacity: 0.85
              }}
            >
              <Popup>
                <div className="text-slate-900 w-full max-w-[240px]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-iris uppercase tracking-wider mb-1">
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
                    className="w-full bg-iris hover:opacity-90 active:scale-95 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <MapPin size={12} />
                    <span>Focus City Sector</span>
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Incident Reports Clustered */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={45}
        >
          {reports.map((report, idx) => {
            const reportKey = `report-marker-${report.id || idx}-${idx}`;
            if (report.status === "PUBLIC_VERIFIED" && report.lat && report.lng && icons.coral) {
              return (
                <Marker key={reportKey} position={[Number(report.lat), Number(report.lng)]} icon={icons.coral}>
                  <Popup>
                    <div className="text-slate-900 w-full max-w-[260px]">
                      <h3 className="font-bold text-base mb-1 wrap-break-word">{report.facilityName || "Verified Incident"}</h3>
                      <p className="text-xs font-semibold text-coral mb-2 wrap-break-word">{report.category}</p>
                      {report.summary ? (
                        <p className="text-xs text-slate-600 mb-2.5 wrap-break-word leading-relaxed">{truncateWords(report.summary)}</p>
                      ) : null}
                      <button 
                        onClick={() => handleOpenReportDetails(report)}
                        className="w-full bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                      >
                        View Full Report
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            } else if (report.status === "ACTION_IGNORED" && report.lat && report.lng && icons.grey) {
              return (
                <Marker key={reportKey} position={[Number(report.lat), Number(report.lng)]} icon={icons.grey}>
                  <Popup>
                    <div className="text-slate-900 w-full max-w-[260px]">
                      <div className="inline-block bg-iris/15 text-iris text-[10px] font-bold px-2 py-0.5 rounded mb-1.5 uppercase tracking-wide border border-iris/30">
                        Action Ignored
                      </div>
                      <h3 className="font-bold text-base mb-1 wrap-break-word">{report.facilityName || "Incident"}</h3>
                      <p className="text-xs font-semibold text-slate-600 mb-2 wrap-break-word">{report.category}</p>
                      {report.summary ? (
                        <p className="text-xs text-slate-600 mb-2.5 wrap-break-word leading-relaxed">{truncateWords(report.summary)}</p>
                      ) : null}
                      <button 
                        onClick={() => handleOpenReportDetails(report)}
                        className="w-full bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                      >
                        View Full Report
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            } else if (report.status === "HEATMAP_AGGREGATED" && report.lat && report.lng) {
              return (
                <CircleMarker
                  key={reportKey}
                  center={[Number(report.lat), Number(report.lng)]}
                  radius={20}
                  fillColor="#00D99D"
                  color="#00D99D"
                  weight={1.5}
                  opacity={1}
                  fillOpacity={0.45}
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

      {/* Full Report Modal - Portaled to document.body so it spans the entire website viewport */}
      {isMounted && selectedReport && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReport(null);
          }}
        >
          <div 
            className="bg-slate-900/98 border border-white/10 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-white/10 relative shrink-0">
              <button 
                onClick={() => setSelectedReport(null)}
                className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                aria-label="Close report details"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-2 pr-10 flex-wrap">
                <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  selectedReport.status === "PUBLIC_VERIFIED" 
                    ? "bg-coral/15 text-coral border border-coral/30" 
                    : selectedReport.status === "ACTION_IGNORED"
                    ? "bg-iris/15 text-iris-400 border border-iris/30"
                    : "bg-mint/15 text-mint border border-mint/30"
                }`}>
                  {selectedReport.status === "PUBLIC_VERIFIED" 
                    ? "Public Verified" 
                    : selectedReport.status === "ACTION_IGNORED"
                    ? "Action Ignored"
                    : "Heatmap Aggregated"}
                </span>

                {selectedReport.plusCode && (
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-md">
                    {selectedReport.plusCode}
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold font-heading text-white wrap-break-word pr-8 leading-snug">
                {selectedReport.facilityName || "Verified Incident Record"}
              </h2>
              <p className="text-xs text-slate-400 wrap-break-word mt-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-mint shrink-0" />
                <span>{selectedReport.region}, {selectedReport.country}</span>
              </p>
            </div>

            {/* Modal Body - Scrollable Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
              {/* Metadata Micro-Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Category</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block wrap-break-word">{selectedReport.category}</span>
                </div>
                <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Incident Date</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block flex items-center gap-1">
                    <Calendar size={12} className="text-iris-400 shrink-0" />
                    <span>{selectedReport.incidentDate || "Undisclosed"}</span>
                  </span>
                </div>
              </div>

              {/* Detailed Narrative */}
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Detailed Narrative
                </h3>
                <div className="bg-black/40 border border-white/5 p-3.5 rounded-xl text-slate-300 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed wrap-break-word max-h-56 overflow-y-auto font-sans select-text">
                  {selectedReport.summary || "No narrative details attached."}
                </div>
              </div>

              {/* Authorities Filed / Details */}
              {selectedReport.authorityDetails && (
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Authority Filings & Misconduct Notes
                  </h3>
                  <div className="bg-iris/10 border border-iris/25 p-3 rounded-xl text-slate-300 text-xs leading-relaxed wrap-break-word">
                    {selectedReport.authorityDetails}
                  </div>
                </div>
              )}

              {/* Alleged Perpetrators if any */}
              {selectedReport.allegedPerpetrators && (
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Perpetrators / Practitioners
                  </h3>
                  <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-slate-300 text-xs wrap-break-word">
                    {selectedReport.allegedPerpetrators}
                  </div>
                </div>
              )}

              {/* Evidence Links */}
              {selectedReport.evidenceLinks && selectedReport.evidenceLinks.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Public Evidence Links
                  </h3>
                  <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl space-y-1.5">
                    {selectedReport.evidenceLinks.map((link, i) => {
                      const isSafe = isValidWebUrl(link);
                      return (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          {isSafe ? (
                            <a 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-mint hover:underline break-all inline-flex items-center gap-1 font-mono text-[11px]"
                            >
                              <ExternalLink size={11} className="shrink-0" />
                              <span>{link}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px] break-all">{link}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 px-5 border-t border-white/10 flex items-center justify-end bg-slate-950/60 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
