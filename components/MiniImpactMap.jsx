"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 11, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function MiniImpactMap({ lat, lng, category, status }) {
  const latitude = Number(lat) || 20;
  const longitude = Number(lng) || 0;

  let circleColor = "#d97706"; // Amber
  if (status === "PUBLIC_VERIFIED") circleColor = "#ef4444"; // Red
  if (status === "ACTION_IGNORED") circleColor = "#94a3b8"; // Slate

  return (
    <div className="w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-white/10 relative shadow-inner">
      <MapContainer
        center={[latitude, longitude]}
        zoom={11}
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={false}
        attributionControl={false}
        preferCanvas={true}
        className="w-full h-full z-0"
        style={{ height: "100%", width: "100%", backgroundColor: "#0f172a" }}
      >
        <RecenterMap lat={latitude} lng={longitude} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles grayscale contrast-125 opacity-75"
          keepBuffer={2}
          updateWhenIdle={true}
          updateWhenZooming={false}
        />
        
        {/* Pulsing Outer Ring */}
        <CircleMarker
          center={[latitude, longitude]}
          radius={28}
          pathOptions={{
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.15,
            weight: 1.5,
            dashArray: "4, 6"
          }}
        />

        {/* Primary Ping Marker */}
        <CircleMarker
          center={[latitude, longitude]}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            fillColor: circleColor,
            fillOpacity: 0.95,
            weight: 2
          }}
        />
      </MapContainer>

      {/* Floating status tag on map */}
      <div className="absolute top-3 left-3 z-[400] bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>LIVE CLUSTER PING ACTIVE</span>
      </div>
    </div>
  );
}
