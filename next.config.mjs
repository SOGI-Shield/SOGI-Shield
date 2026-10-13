import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: {
    resolveAlias: {
      'firebase/app': './node_modules/firebase/app/dist/esm/index.esm.js',
      'firebase/firestore/lite': './node_modules/firebase/firestore/lite/dist/esm/index.esm.js',
      'firebase/firestore': './node_modules/firebase/firestore/dist/esm/index.esm.js',
      '@firebase/firestore/lite': './node_modules/@firebase/firestore/dist/lite/index.browser.esm.js',
      '@firebase/firestore': './node_modules/@firebase/firestore/dist/index.esm.js',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/app': path.resolve(__dirname, 'node_modules/firebase/app/dist/esm/index.esm.js'),
      'firebase/firestore/lite': path.resolve(__dirname, 'node_modules/firebase/firestore/lite/dist/esm/index.esm.js'),
      'firebase/firestore': path.resolve(__dirname, 'node_modules/firebase/firestore/dist/esm/index.esm.js'),
      '@firebase/firestore/lite': path.resolve(__dirname, 'node_modules/@firebase/firestore/dist/lite/index.browser.esm.js'),
      '@firebase/firestore': path.resolve(__dirname, 'node_modules/@firebase/firestore/dist/index.esm.js'),
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: '/privacy.md',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/PRIVACY.md',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/privacy.html',
        destination: '/privacy',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:file*.geojson',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
