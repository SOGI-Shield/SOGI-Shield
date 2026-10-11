// Shared client-side GeoJSON service with memory and sessionStorage caching
// Prevents duplicate downloads of large GeoJSON files across page transitions.

const memoryCache = new Map();
const inFlightRequests = new Map();

/**
 * Fetches and caches a GeoJSON resource.
 * Checks in-memory cache, then sessionStorage, then network.
 * Deduplicates concurrent network requests for the same path.
 */
export async function getGeoJson(path) {
  if (typeof window === "undefined") return null;

  // 1. In-memory check (fastest: 0ms)
  if (memoryCache.has(path)) {
    return memoryCache.get(path);
  }

  // 2. Session storage check
  try {
    const sessionKey = `sogi_geojson_${path}`;
    const cachedStr = sessionStorage.getItem(sessionKey);
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr);
      memoryCache.set(path, parsed);
      return parsed;
    }
  } catch {}

  // 3. Deduplicate in-flight network requests
  if (inFlightRequests.has(path)) {
    return inFlightRequests.get(path);
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(path, {
        headers: { Accept: "application/json" },
        cache: "force-cache"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      memoryCache.set(path, data);
      
      try {
        // Only cache in sessionStorage if under 1MB to avoid storage quota exceeded
        const jsonStr = JSON.stringify(data);
        if (jsonStr.length < 1000000) {
          sessionStorage.setItem(`sogi_geojson_${path}`, jsonStr);
        }
      } catch {}

      return data;
    } catch (err) {
      console.warn(`[geoDataService] Failed to load ${path}:`, err.message || err);
      return null;
    } finally {
      inFlightRequests.delete(path);
    }
  })();

  inFlightRequests.set(path, fetchPromise);
  return fetchPromise;
}

export function clearGeoCache() {
  memoryCache.clear();
}
