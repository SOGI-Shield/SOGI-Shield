/**
 * Open Location Code (Plus Code) implementation for SOGI-Shield.
 * Completely offline, zero-dependency, zero-knowledge mathematical geocoding.
 * Standard Apache 2.0 Open Location Code specification.
 */

const CODE_ALPHABET = "23456789CFGHJMPQRVWX";
const ENCODING_BASE = 20;
const PAIR_RESOLUTIONS = [20.0, 1.0, 0.05, 0.0025, 0.000125];
const SEPARATOR = "+";

/**
 * Validates whether a given string is a valid Full or Short Plus Code.
 */
export function isValidPlusCode(code) {
  if (!code || typeof code !== "string") return false;
  const clean = code.trim().toUpperCase();
  // Valid full code: 8 chars + '+' + 2 chars (e.g. 8FW4V75V+9Q) or short code: 4-6 chars + '+' + 2 chars
  return /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}$/.test(clean);
}

/**
 * Encodes latitude and longitude into a standard Open Location Code (Plus Code).
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @param {number} longitude - Longitude in degrees (-180 to 180)
 * @param {number} codeLength - Number of digits (default 10, approx 14x14m area)
 * @returns {string} Standard Plus Code (e.g. "8FW4V75V+9Q")
 */
export function encodePlusCode(latitude, longitude, codeLength = 10) {
  let lat = typeof latitude === "number" ? latitude : parseFloat(latitude);
  let lng = typeof longitude === "number" ? longitude : parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) return null;

  // Clamp latitude to [-90, 90]
  if (lat < -90) lat = -90;
  if (lat > 90) lat = 90;

  // Normalize longitude to [-180, 180)
  while (lng < -180) lng += 360;
  while (lng >= 180) lng -= 360;

  if (lat === 90) lat = lat - 0.0000001;

  let latVal = lat + 90;
  let lngVal = lng + 180;

  let code = "";
  for (let i = 0; i < 5; i++) {
    const res = PAIR_RESOLUTIONS[i];
    const latDigit = Math.floor(latVal / res);
    const lngDigit = Math.floor(lngVal / res);

    latVal -= latDigit * res;
    lngVal -= lngDigit * res;

    code += CODE_ALPHABET[latDigit] + CODE_ALPHABET[lngDigit];
    if (code.length === 8) {
      code += SEPARATOR;
    }
  }

  return code.slice(0, codeLength > 8 ? codeLength + 1 : codeLength);
}

/**
 * Decodes a Plus Code into geographic coordinates (center lat/lng and bounds).
 * @param {string} code - Full Plus Code
 * @returns {{ lat: number, lng: number, resolution: number } | null}
 */
export function decodePlusCode(code) {
  if (!code || typeof code !== "string") return null;
  const clean = code.trim().toUpperCase().replace(/\+/g, "");

  if (!clean || clean.length < 2) return null;

  let latVal = 0;
  let lngVal = 0;
  const pairs = Math.min(5, Math.floor(clean.length / 2));

  for (let i = 0; i < pairs; i++) {
    const latChar = clean[i * 2];
    const lngChar = clean[i * 2 + 1];
    const latIdx = CODE_ALPHABET.indexOf(latChar);
    const lngIdx = CODE_ALPHABET.indexOf(lngChar);

    if (latIdx === -1 || lngIdx === -1) return null;

    const res = PAIR_RESOLUTIONS[i];
    latVal += latIdx * res;
    lngVal += lngIdx * res;
  }

  const resolution = PAIR_RESOLUTIONS[pairs - 1];
  const centerLat = latVal - 90 + resolution / 2;
  const centerLng = lngVal - 180 + resolution / 2;

  return {
    lat: parseFloat(centerLat.toFixed(6)),
    lng: parseFloat(centerLng.toFixed(6)),
    resolution
  };
}
