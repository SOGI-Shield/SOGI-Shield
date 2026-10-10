# SOGI-Shield Codebase Instructions for Agents

Welcome, Agent. When working on this codebase, you MUST adhere to the following architecture rules, constraints, and styling guidelines.

## 1. Project Overview & Purpose
**SOGI-Shield** is a secure, zero-touch platform dedicated to global LGBTQ+ and non-binary human rights reporting, documentation, and institutional accountability. The platform allows users to submit incident reports completely anonymously (no accounts, no IPs logged) and generates a secure tracking code for them to follow up on their case.

## 2. Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS (Vanilla CSS in `app/globals.css` used rarely, mostly for third-party overrides like Leaflet)
- **Database/Backend:** Firebase (Firestore) - Client-side SDK (`firebase/app`, `firebase/firestore`)
- **Maps:** Leaflet & React-Leaflet
- **Deployment Target:** Cloudflare Pages (Edge runtime)

## 3. Architecture & Edge Deployment Constraints (CRITICAL)
- **Cloudflare Edge Runtime:** The application is deployed to Cloudflare. This means server-side code runs in an Edge environment, **not standard Node.js**.
- **No Node.js APIs on Edge:** Do not use Node-specific modules (like `fs`, `child_process`) in server components or API routes without ensuring they are compatible with the Edge runtime or strictly isolated.
- **Dynamic Imports & `ssr: false`:** Any component that relies on heavy browser-only APIs (like `window`, `document`) MUST be dynamically imported with `{ ssr: false }`.
  - **Leaflet Maps:** Always wrap Leaflet map components in a dynamically imported client wrapper (e.g., `MapClient.jsx`).
  - **Heavy/Client-heavy components:** Form handling and map rendering are offloaded to client components (`ReportClient.jsx`, `TrackClient.jsx`).

## 4. UI/UX & Responsive Design (Mobile-First)
- **Premium Dark Mode Aesthetics:** The app uses a dark slate theme (`bg-slate-950`). Use glassmorphism (`bg-slate-900/60 backdrop-blur-xl border border-white/10`) for cards and containers.
- **Vibrant Accents:** Use gradients for primary actions and headings (e.g., `bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400`).
- **Responsive Sizing (Mobile-First):** Always use Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`). 
  - **Text:** Never use massive text sizes (like `text-5xl` or `text-6xl`) on mobile without scaling. Always write scaling classes like `text-3xl sm:text-4xl md:text-5xl`.
  - **Padding/Spacing:** Never use large paddings (like `p-12`) globally. Scale paddings appropriately for mobile to prevent overflow (e.g., `p-6 sm:p-10`).
  - **Flex/Grid:** Ensure layouts stack on mobile (`flex-col sm:flex-row`, `grid-cols-1 md:grid-cols-2`). Prevent horizontal scrolling on small viewports at all costs.

## 5. Firebase & Firestore Security
- **Client-Side Operations:** Database interactions happen directly from the client components using the Firebase Client SDK (`firebase.config.js`). 
- **Firestore Rules:** Strict schema validation is enforced via `firestore.rules`. Before attempting to write or update data structures, review `firestore.rules` to ensure the outgoing payload exactly matches the allowed fields and types. (e.g., valid strings, allowed categories).
- **No Admin SDK:** Do not attempt to use `firebase-admin` in this project. All writes are anonymous client writes governed by `firestore.rules`.

## 6. Development Workflow
- Local Dev Server: `npm run dev` (Runs on `http://localhost:3000`).
- Always check the browser DOM or terminal output for hydration errors or edge-runtime crashes when introducing new dependencies.

Follow these rules closely to ensure compatibility, security, and a beautiful user experience.
