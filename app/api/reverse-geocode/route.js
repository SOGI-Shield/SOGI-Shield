import { NextResponse } from "next/server";
import { encodePlusCode } from "@/lib/pluscode";

export const runtime = "edge";

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
      signal: AbortSignal.timeout(5000)
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

        // Determine most suitable region
        const region = state || district || city || name || "";

        // Build clean deduplicated formatted address
        const addressParts = [name, street, city, state, country].filter(Boolean);
        const uniqueParts = addressParts.filter((item, index) => addressParts.indexOf(item) === index);
        const formattedAddress = uniqueParts.join(", ") || `${region}, ${country}`.replace(/^, |, $/g, "");

        if (country || region) {
          const plusCode = encodePlusCode(latitude, longitude);
          return {
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
      signal: AbortSignal.timeout(5000)
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
          return {
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
  return {
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
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng") || searchParams.get("lon");

    const result = await performReverseGeocode(lat, lng);
    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const lat = body?.lat;
    const lng = body?.lng ?? body?.lon;

    const result = await performReverseGeocode(lat, lng);
    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
