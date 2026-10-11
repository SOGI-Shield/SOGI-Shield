import { NextResponse } from "next/server";
import { encodePlusCode } from "@/lib/pluscode";

export const runtime = "edge";

// High-speed in-memory edge cache (LRU-like Map) for reverse geocoding
const reverseGeocodeCache = new Map();
const MAX_CACHE_SIZE = 300;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCachedReverse(key) {
  const cached = reverseGeocodeCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    reverseGeocodeCache.delete(key);
    return null;
  }
  return cached.data;
}

function setCachedReverse(key, data) {
  if (reverseGeocodeCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = reverseGeocodeCache.keys().next().value;
    if (oldestKey) reverseGeocodeCache.delete(oldestKey);
  }
  reverseGeocodeCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Robust Reverse Geocoding API powered by Photon by Komoot.
 * Includes fallback to OpenStreetMap Nominatim and graceful coordinate handling.
 */
async function performReverseGeocode(lat, lng) {
  // Validate coordinate boundaries
  const latitude = typeof lat === "number" ? lat : parseFloat(lat);
  const longitude = typeof lng === "number" ? lng : parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return { error: "Invalid coordinates: latitude and longitude must be numbers.", status: 400 };
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { error: "Coordinates out of bounds. Latitude must be between -90 and 90, longitude between -180 and 180.", status: 400 };
  }

  // Quantize coordinates to 3 decimal places (~110 meters) for high cache hit rates
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = getCachedReverse(cacheKey);
  if (cached) {
    return cached;
  }

  // -------------------------------------------------------------
  // Tier 1: Photon by Komoot (Primary, fast, OSM-based search)
  // -------------------------------------------------------------
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`;
    const photonRes = await fetch(photonUrl, {
      headers: {
        "User-Agent": "SOGI-Shield/1.0 (Global Human Rights Documentation; contact@sogi-shield.org)",
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(4000)
    });

    if (photonRes.ok) {
      const data = await photonRes.json();
      if (data && data.features && data.features.length > 0) {
        const props = data.features[0].properties || {};
        
        const country = props.country || "";
        const state = props.state || "";
        const city = props.city || props.town || props.village || props.municipality || "";
        const district = props.district || props.county || props.locality || props.suburb || "";
        const name = props.name || "";
        const street = props.street || "";

        const region = state || district || city || name || "";

        const addressParts = [name, street, city, state, country].filter(Boolean);
        const uniqueParts = addressParts.filter((item, index) => addressParts.indexOf(item) === index);
        const formattedAddress = uniqueParts.join(", ") || `${region}, ${country}`.replace(/^, |, $/g, "");

        if (country || region) {
          const plusCode = encodePlusCode(latitude, longitude);
          const result = {
            success: true,
            lat: latitude,
            lng: longitude,
            plusCode,
            country: country || "Unknown",
            region: region || "Unknown",
            city: city || district || "",
            district: district || "",
            formattedAddress: formattedAddress || (plusCode ? `Plus Code: ${plusCode}` : `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`),
            source: "photon_by_komoot",
            verified: true
          };
          setCachedReverse(cacheKey, result);
          return result;
        }
      }
    }
  } catch (photonErr) {
    console.warn("Photon by Komoot reverse geocoding notice:", photonErr.message || photonErr);
  }

  // -------------------------------------------------------------
  // Tier 2: OpenStreetMap Nominatim Reverse Geocoding Fallback
  // -------------------------------------------------------------
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`;
    const nomRes = await fetch(nomUrl, {
      headers: {
        "User-Agent": "SOGI-Shield/1.0 (Global Human Rights Documentation; contact@sogi-shield.org)",
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(4000)
    });

    if (nomRes.ok) {
      const data = await nomRes.json();
      if (data && data.address) {
        const addr = data.address;
        const country = addr.country || "";
        const region = addr.state || addr.province || addr.region || addr.county || addr.district || "";
        const city = addr.city || addr.town || addr.village || addr.municipality || "";

        if (country || region) {
          const plusCode = encodePlusCode(latitude, longitude);
          const result = {
            success: true,
            lat: latitude,
            lng: longitude,
            plusCode,
            country: country || "Unknown",
            region: region || city || "Unknown",
            city: city || "",
            district: addr.county || addr.district || "",
            formattedAddress: data.display_name || `${region}, ${country}`,
            source: "nominatim_reverse",
            verified: true
          };
          setCachedReverse(cacheKey, result);
          return result;
        }
      }
    }
  } catch (nomErr) {
    console.warn("Nominatim reverse geocoding fallback notice:", nomErr.message || nomErr);
  }

  // -------------------------------------------------------------
  // Tier 3: Graceful coordinate-only fallback (e.g. remote ocean)
  // -------------------------------------------------------------
  const plusCode = encodePlusCode(latitude, longitude);
  const fallbackResult = {
    success: true,
    lat: latitude,
    lng: longitude,
    plusCode,
    country: "International Territory",
    region: plusCode ? `Sector ${plusCode.slice(0, 8)}` : "International Sector",
    city: "",
    formattedAddress: plusCode ? `Plus Code: ${plusCode}` : `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    source: "plus_code_fallback",
    verified: false
  };
  setCachedReverse(cacheKey, fallbackResult);
  return fallbackResult;
}

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
  "CDN-Cache-Control": "public, s-maxage=604800"
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng") || searchParams.get("lon");

    const result = await performReverseGeocode(lat, lng);
    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: result.status });
    }
    return NextResponse.json(result, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("Reverse Geocoding GET route error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const lat = body?.lat ?? body?.latitude;
    const lng = body?.lng ?? body?.longitude ?? body?.lon;

    const result = await performReverseGeocode(lat, lng);
    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: result.status });
    }
    return NextResponse.json(result, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("Reverse Geocoding POST route error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
