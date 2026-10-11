import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Robust Forward Geocoding API powered by Photon by Komoot.
 * Includes tiered query resolution and fallback to OpenStreetMap Nominatim.
 */
async function queryPhoton(queryString) {
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(queryString)}&limit=1`;
    const res = await fetch(photonUrl, {
      headers: {
        "User-Agent": "SOGI-Shield/1.0 (Global Human Rights Documentation; contact@sogi-shield.org)",
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lon, lat] = feature.geometry.coordinates;
        if (typeof lat === "number" && typeof lon === "number") {
          const props = feature.properties || {};
          const country = props.country || "";
          const state = props.state || "";
          const city = props.city || props.town || props.village || "";
          const name = props.name || "";
          const addressParts = [name, city, state, country].filter(Boolean);
          const formattedAddress = addressParts.join(", ") || queryString;

          return {
            success: true,
            lat,
            lng: lon,
            formattedAddress,
            source: "photon_by_komoot"
          };
        }
      }
    }
  } catch (err) {
    console.warn("Photon forward geocode error for query:", queryString, err.message || err);
  }
  return null;
}

async function queryNominatim(queryString) {
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryString)}&limit=1`;
    const res = await fetch(nomUrl, {
      headers: {
        "User-Agent": "SOGI-Shield/1.0 (Global Human Rights Documentation; contact@sogi-shield.org)",
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            success: true,
            lat,
            lng: lon,
            formattedAddress: item.display_name || queryString,
            source: "nominatim"
          };
        }
      }
    }
  } catch (err) {
    console.warn("Nominatim forward geocode error for query:", queryString, err.message || err);
  }
  return null;
}

/**
 * Executes tiered geocoding with intelligent fallback:
 * 1. Specific full query (facility + region + country)
 * 2. Broad regional query (region + country) if specific query is unindexed
 */
async function performForwardGeocode(params) {
  const { address, region, country, q } = params;

  // Build candidate query list from specific to broader
  const candidateQueries = [];

  if (q && q.trim()) {
    candidateQueries.push(q.trim());
  }

  const fullParts = [address, region, country].map(s => s?.trim()).filter(Boolean);
  if (fullParts.length > 0) {
    candidateQueries.push(fullParts.join(", "));
  }

  const broadParts = [region, country].map(s => s?.trim()).filter(Boolean);
  if (broadParts.length > 0 && broadParts.join(", ") !== candidateQueries[candidateQueries.length - 1]) {
    candidateQueries.push(broadParts.join(", "));
  }

  if (country && country.trim() && !candidateQueries.includes(country.trim())) {
    candidateQueries.push(country.trim());
  }

  // Deduplicate candidates
  const uniqueCandidates = [...new Set(candidateQueries)];

  if (uniqueCandidates.length === 0) {
    return { error: "Please provide a region, country, or location query to geocode.", status: 400 };
  }

  // Try candidate queries in sequence
  for (const query of uniqueCandidates) {
    // Tier 1: Photon by Komoot
    const photonResult = await queryPhoton(query);
    if (photonResult) return photonResult;

    // Tier 2: Nominatim
    const nomResult = await queryNominatim(query);
    if (nomResult) return nomResult;
  }

  return {
    error: `Could not pinpoint location for '${uniqueCandidates[0]}'. Please check spelling for Region and Country.`,
    status: 404
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || searchParams.get("query") || "";
    const address = searchParams.get("address") || "";
    const region = searchParams.get("region") || "";
    const country = searchParams.get("country") || "";

    const result = await performForwardGeocode({ q, address, region, country });
    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Geocoding GET route error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const q = body?.q || body?.query || "";
    const address = body?.address || "";
    const region = body?.region || "";
    const country = body?.country || "";

    const result = await performForwardGeocode({ q, address, region, country });
    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Geocoding POST route error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
