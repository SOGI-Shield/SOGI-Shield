import fs from 'fs';
import { getAccessToken, getDocument } from './lib/edgeFirebase.js';

const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let val = match[2];
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        process.env[match[1]] = val;
    }
});

// In Node 18+, crypto is global, but just in case, we can ensure it's there
if (!globalThis.crypto) {
    globalThis.crypto = require('crypto').webcrypto;
}

async function run() {
    try {
        console.log("Getting access token...");
        const token = await getAccessToken();
        console.log("Token retrieved successfully:", token.substring(0, 10) + "...");
        
        console.log("Trying to get a document...");
        const doc = await getDocument('reports', 'test');
        console.log("Result:", doc);
    } catch (err) {
        console.error("Error:", err);
    }
}

run();
