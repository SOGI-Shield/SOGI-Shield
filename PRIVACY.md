# Privacy Policy — SOGI-Shield

> **Effective Date:** October 2026 (Version 1.2.0)  
> **Repository:** [github.com/Shubham-hahh/SOGI-Shield](https://github.com/Shubham-hahh/SOGI-Shield)  
> **Live Application:** [sogi-shield.pages.dev/privacy](https://sogi-shield.vercel.app/privacy)  
> **Automated Policy Route:** Requests to `/privacy.md`, `/PRIVACY.md`, or `/privacy-policy` automatically route to `/privacy`.

---

## 🛡️ Core Philosophy: Zero-Touch, Zero-Logging

**SOGI-Shield** is an open-source, humanitarian platform dedicated to global LGBTQ+ and non-binary human rights documentation, incident reporting, and institutional accountability. Because this platform is often accessed by individuals living in high-risk, hostile, or criminalized jurisdictions, **privacy and digital safety are architectural absolutes, not marketing slogans.**

We operate under a strict **Zero-Touch** and **Zero-Logging** framework. We do not want, collect, or store your personal identity.

---

## 🚫 1. What We NEVER Collect

* ❌ **No IP Addresses:** We do not log, retain, or store user IP addresses on our edge network, serverless functions, or databases.
* ❌ **No Accounts or Passwords:** There is no registration, login, email verification, or phone number required to submit an incident or check tracking status.
* ❌ **No Browser Fingerprinting:** We do not capture canvas fingerprints, audio fingerprints, battery status, or hardware telemetry.
* ❌ **No Tracking Cookies or Analytics:** We use zero marketing trackers, zero advertising pixels, and zero third-party behavioral analytics (no Google Analytics, no Meta Pixel).
* ❌ **No Passive Device Profiling:** We never inspect your device storage or read ambient device sensors.

---

## 🔒 2. Client-Side Selective Hybrid Compression (`c_data`)

To minimize data exposure and prevent deep-packet or database narrative snooping, SOGI-Shield employs **Selective Hybrid Compression** directly within your browser:

### In-Browser Gzip Stream Compression
* **Client-Side Execution:** Before any incident narrative, witness testimony, authority filing notes, or alleged perpetrator details leave your device, they are compressed into an opaque binary Base64 payload (`c_data`) using the browser-native `CompressionStream('gzip')` API.
* **Opaque Storage:** Cloud Firestore and intermediary network hops only store and transmit this compressed binary representation, not readable raw narrative text strings.
* **Instant Client-Side Decompression:** When an authorized user or public visitor inspects an incident, your browser decompresses `c_data` locally in under 2 milliseconds via `DecompressionStream('gzip')`.

### Strict Quarantining of Plaintext Metadata
To preserve essential map filtering and security rules without compromising privacy, only non-identifiable operational metadata remains plaintext:
* Coarse geographic coordinates (`lat`, `lng`, `plusCode`) for Leaflet layer positioning.
* Categorical classification (e.g., `harassment`, `conversion_therapy`).
* Verification status (`PUBLIC_VERIFIED`, `HEATMAP_AGGREGATED`, `ACTION_IGNORED`).
All detailed textual evidence, descriptions, and notes remain quarantined inside the compressed binary blob.

---

## 📍 3. Geolocation, Plus Codes & User Choice (Incident Sector Mapping)

### Strictly User-Initiated & Voluntary
* **Zero Background Tracking:** SOGI-Shield **never** passively, silently, or automatically accesses your device's GPS or geolocation hardware. 
* **Explicit User Choice:** Your device location is requested **only** if you explicitly click the **"Auto-Detect Location (Photon)"** button on the incident report form.
* **Single Purpose (Sector Resolution / Geoguessing):** The sole reason geolocation is ever queried is to determine the coarse incident region and country to populate the report form.
* **Open-Source Reverse Geocoding (Photon & OpenStreetMap):** When you choose to use the auto-detect feature, coordinates are resolved via the privacy-respecting Photon reverse geocoder (powered by OpenStreetMap). Once the administrative region/country is identified, precise raw device coordinates are not retained on our servers.
* **100% Offline & Manual Alternative:** You are never required to grant location permissions. You can always:
  1. Manually type your country and region.
  2. Search our offline dataset of over **1,200+ verified cities and districts** (sourced from Natural Earth & GeoNames) without sharing any location data with any service.

### Plus Code (Open Location Code) Sector Guarding
To prevent micro-triangulation of specific households, shelters, or community centers:
* Incidents are tagged with **Open Location Codes (Plus Codes)** (e.g., `7MJCQ966+22`) representing wide geographic blocks rather than exact street addresses.
* Sensitive community facilities and unverified incidents are aggregated into wide heatmaps rather than pinpoint street markers.

---

## 🗄️ 4. Report Data, Storage, & Geographic Protection

### Where Incident Reports Are Stored
All submitted reports are securely stored in **Google Cloud Firestore (Firebase)** with encryption at rest and in transit (TLS 1.3). Database writes are anonymous client writes governed by strict schema validation defined in `firestore.rules`.
* Incoming writes are strictly validated with `hasOnlyAllowedFields`, rejecting any unexpected tracking parameters, cookies, or excess data.
* Anonymous tracking secrets (e.g. `SOGI-2026-XXXXXXXX`) allow submitters to follow up on their case without requiring email addresses or user accounts.

### Preventing Pinpoint Triangulation
To protect individuals and local communities from retaliation or geographic triangulation:
* **Public Verified Reports:** Only incidents with verifiable public evidence (such as reputable news articles or official court records) display markers on the public interactive map.
* **Heatmap Aggregated:** Incident reports without public links are automatically coarsened and aggregated into wide regional heatmaps (`#00D99D` Vivid Mint density layers) to prevent bad actors from deducing exact incident coordinates.

---

## 🚨 5. Panic Button & In-Browser Ephemeral Operations

* **Instant Panic Button:** Clicking the Emergency Panic Button immediately overwrites session memory, purges all `localStorage` and `sessionStorage`, replaces the browser history entry, and redirects the tab to an innocuous educational website (e.g., Wikipedia).
* **Local In-Browser Complaint Generation:** The **Global Action Portal** generates formal United Nations (OHCHR) and local Human Rights Commission complaint PDFs entirely client-side using `jsPDF`. Your victim narrative, witness testimonies, and legal details remain strictly in your browser memory and never touch our servers.
* **Client-Side Incident Caution Graphics:** Emergency community warning cards are rendered client-side on HTML5 Canvas and saved directly to your local device for peer-to-peer distribution (via Signal, Telegram, or WhatsApp).

---

## 🤖 6. Anti-Bot Defense (Cloudflare Turnstile)

To protect the platform from automated spam and Denial-of-Service attacks without degrading user privacy, we deploy **Cloudflare Turnstile**.
* Unlike legacy CAPTCHAs, Turnstile verifies humanity without collecting invasive biometric or behavioural profiles across other websites.
* SOGI-Shield passes zero user-identifiable data or report contents to Cloudflare.

---

## 🔍 7. Open Source Accountability

Because security claims in human rights contexts require verification rather than blind trust:
* The complete source code of SOGI-Shield is public under the GNU General Public License:  
  [https://github.com/Shubham-hahh/SOGI-Shield](https://github.com/Shubham-hahh/SOGI-Shield)
* Independent security researchers, human rights organizations, and activists are encouraged to inspect and audit our client components, edge headers, and security rules.

---

## 📬 8. Contact & Security Reports

If you identify a security issue, vulnerability, or privacy leak in SOGI-Shield:
* Open an advisory or issue on GitHub: [github.com/Shubham-hahh/SOGI-Shield/issues](https://github.com/Shubham-hahh/SOGI-Shield/issues)

