# SOGI-Shield

A privacy-first, zero-touch, open-source web application dedicated to global LGBTQ+ / non-binary human rights reporting, documentation, and institutional accountability.

## 🛡️ Core Features

- **Zero-Touch Automated Classification**: No manual moderation. Entries with valid evidence links are marked `PUBLIC_VERIFIED`. Entries without are marked `HEATMAP_AGGREGATED` for privacy and safety.
- **Privacy First**: We do not collect, log, or store IP addresses, user-agents, or browser fingerprints. No user accounts are required.
- **Panic Button**: Instantly clears browser storage and redirects to Wikipedia.
- **UN & Local HRC Action Portal**: Generate formal complaint PDFs locally in your browser. No personal data for these complaints touches the server.
- **Privacy Policy**: Read our comprehensive [Privacy Policy](/app/privacy/page.jsx) that outlines exactly how we protect users.

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Mapping**: Leaflet / React-Leaflet
- **Backend**: Firebase Firestore (Client-side Web SDK)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/sogi-shield.git
cd sogi-shield
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables (Dynamic Gist Fetching)
This project is configured to dynamically pull environment variables at build-time from a central GitHub Gist to simplify remote deployments.

When you run `npm run build` or `npm run deploy`, the `prebuild` script automatically downloads the latest `.env.local` file from the remote Gist URL, so you do not need to manually configure environment variables in your CI/CD pipeline!

To develop locally without the Gist, you can manually copy the `.env.example` file:
```bash
cp .env.example .env.local
```

### 4. Cloudflare Deployment (OpenNext)
SOGI-Shield is configured to deploy directly to **Cloudflare Workers** using [OpenNext](https://opennext.js.org/cloudflare). 

Deployments are entirely automated via GitHub Actions on every push to the `main` branch. 

**To enable GitHub Actions Deployments:**
1. Generate a Cloudflare API Token (Edit Cloudflare Workers template).
2. Copy your Cloudflare Account ID from the Workers & Pages dashboard.
3. Add both as GitHub Repository Secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

### 5. Firebase Setup
- Create a new Firebase project.
- Enable Firestore Database.
- Apply the rules found in `firestore.rules` to your Firestore instance.

### 6. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contribution Guidelines
We welcome contributions to SOGI-Shield. Please read our contributing guidelines (coming soon) and ensure all PRs maintain our strict privacy and zero-touch moderation principles.

## 📄 License
This project is licensed under the [GNU General Public License v3.0](LICENSE) - see the [LICENSE](LICENSE) file for details.
