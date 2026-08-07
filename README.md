# SOGI-Shield

A privacy-first, zero-touch, open-source web application dedicated to global LGBTQ+ / non-binary human rights reporting, documentation, and institutional accountability.

## 🛡️ Core Features

- **Zero-Touch Automated Classification**: No manual moderation. Entries with valid evidence links are marked `PUBLIC_VERIFIED`. Entries without are marked `HEATMAP_AGGREGATED` for privacy and safety.
- **Privacy First**: We do not collect, log, or store IP addresses, user-agents, or browser fingerprints. No user accounts are required.
- **Panic Button**: Instantly clears browser storage and redirects to Wikipedia.
- **UN & Local HRC Action Portal**: Generate formal complaint PDFs locally in your browser. No personal data for these complaints touches the server.

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

### 3. Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Firebase project credentials in `.env.local`.

### 4. Firebase Setup
- Create a new Firebase project.
- Enable Firestore Database.
- Apply the rules found in `firestore.rules` to your Firestore instance.

### 5. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contribution Guidelines
We welcome contributions to SOGI-Shield. Please read our contributing guidelines (coming soon) and ensure all PRs maintain our strict privacy and zero-touch moderation principles.

## 📄 License
This project is licensed under the [GNU General Public License v3.0](LICENSE) - see the [LICENSE](LICENSE) file for details.
