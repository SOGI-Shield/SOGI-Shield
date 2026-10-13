/**
 * Browser-native selective hybrid payload compression for SOGI-Shield.
 * Uses CompressionStream('gzip') and DecompressionStream('gzip') via Streams API.
 * Keeps map coordinates and query indexes plaintext while compressing heavy narratives.
 */

// Helper to convert Uint8Array / ArrayBuffer to Base64 safely without call stack overflow
function uint8ArrayToBase64(bytes) {
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

// Helper to convert Base64 string to Uint8Array
function base64ToUint8Array(base64String) {
  const binary = atob(base64String);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compresses an object or string to a Base64-encoded gzip binary string.
 * @param {any} obj - Object, array, or string to compress.
 * @returns {Promise<string>} Base64 compressed string.
 */
export async function compressPayload(obj) {
  if (obj === null || obj === undefined) return "";

  const jsonString = typeof obj === "string" ? obj : JSON.stringify(obj);

  // Fallback if CompressionStream is unsupported
  if (typeof CompressionStream === "undefined") {
    try {
      return btoa(unescape(encodeURIComponent(jsonString)));
    } catch {
      return btoa(jsonString);
    }
  }

  const stream = new Blob([jsonString]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
  const buffer = await new Response(compressedStream).arrayBuffer();
  return uint8ArrayToBase64(new Uint8Array(buffer));
}

/**
 * Decompresses a Base64-encoded gzip string back to its original JSON object or string.
 * @param {string} base64String - Base64 gzip string.
 * @returns {Promise<any>} Decompressed JSON object or raw string.
 */
export async function decompressPayload(base64String) {
  if (!base64String || typeof base64String !== "string") return null;

  // Fallback if DecompressionStream is unsupported
  if (typeof DecompressionStream === "undefined") {
    try {
      const decoded = decodeURIComponent(escape(atob(base64String)));
      return JSON.parse(decoded);
    } catch {
      try {
        return JSON.parse(atob(base64String));
      } catch {
        return null;
      }
    }
  }

  try {
    const bytes = base64ToUint8Array(base64String);
    const stream = new Blob([bytes]).stream();
    const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(decompressedStream).text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (err) {
    // Attempt fallback decode if it was compressed with legacy/simple btoa
    try {
      const decoded = decodeURIComponent(escape(atob(base64String)));
      return JSON.parse(decoded);
    } catch {
      console.warn("[compress] Decompression failed for payload:", err);
      return null;
    }
  }
}

/**
 * Convenience helper to hydrate a report that may contain `c_data`.
 * Returns the report with decompressed fields merged, or the original report if uncompressed.
 * @param {object} report - Report document from Firestore or cache.
 * @returns {Promise<object>} Hydrated report.
 */
export async function decompressReport(report) {
  if (!report || typeof report !== "object") return report;
  if (!report.c_data) return report;

  try {
    const decompressed = await decompressPayload(report.c_data);
    if (decompressed && typeof decompressed === "object") {
      return {
        ...report,
        ...decompressed,
        _isDecompressed: true,
      };
    }
  } catch (err) {
    console.warn("[compress] Failed to decompress report:", err);
  }
  return report;
}
