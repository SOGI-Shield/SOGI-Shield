// Shared reports cache and synchronization service
// Eliminates duplicate Firestore reads between Map and HomepageMetrics,
// and respects mobile battery/data by pausing polling when the tab is backgrounded.

import { collection, getDocs, query } from "firebase/firestore/lite";
import { db, isMockMode } from "@/lib/firebase";

let cachedReports = null;
let lastFetchTime = 0;
let inFlightFetch = null;
const CACHE_TTL_MS = 45000; // 45 seconds cache validity

const subscribers = new Set();

export async function fetchAllReports(force = false) {
  const now = Date.now();

  // Return cached result if fresh and not forced
  if (!force && cachedReports && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedReports;
  }

  // Deduplicate in-flight fetch
  if (inFlightFetch) {
    return inFlightFetch;
  }

  inFlightFetch = (async () => {
    try {
      if (isMockMode) {
        const m = await import("@/src/data/mockReports.json");
        const staticReports = m.default || m;
        let combined = staticReports;
        try {
          const { getLocalReports } = await import("@/lib/localStore");
          const localReports = getLocalReports();
          combined = [
            ...localReports,
            ...staticReports.filter(s => !localReports.some(l => l.id === s.id))
          ];
        } catch {}
        cachedReports = combined;
        lastFetchTime = Date.now();
        notifySubscribers(cachedReports);
        return cachedReports;
      }

      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your_api_key_here" && db) {
        const q = query(collection(db, "reports"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        cachedReports = fetched;
        lastFetchTime = Date.now();
        notifySubscribers(cachedReports);
        return cachedReports;
      }

      return [];
    } catch (err) {
      console.error("[reportsCache] Error fetching reports:", err);
      return cachedReports || [];
    } finally {
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}

function notifySubscribers(data) {
  subscribers.forEach(cb => {
    try {
      cb(data);
    } catch (e) {
      console.error("[reportsCache] Subscriber callback error:", e);
    }
  });
}

/**
 * React hook or listener registration with visibility awareness
 */
export function subscribeReports(callback) {
  subscribers.add(callback);
  if (cachedReports) {
    callback(cachedReports);
  }
  return () => {
    subscribers.delete(callback);
  };
}

let pollerActive = false;
let pollIntervalId = null;

export function initBackgroundPoller() {
  if (typeof window === "undefined" || pollerActive) return;
  pollerActive = true;

  const runPoll = () => {
    // Only poll if tab is active and visible
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      fetchAllReports(true);
    }
  };

  // Poll every 60s
  pollIntervalId = setInterval(runPoll, 60000);

  // Resume immediately on visibility change if cache is stale
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const now = Date.now();
      if (!cachedReports || (now - lastFetchTime) > CACHE_TTL_MS) {
        fetchAllReports(false);
      }
    }
  });
}
