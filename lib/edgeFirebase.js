// A purely Edge-compatible Firebase REST API client for Cloudflare Pages

function base64url(source) {
  let encoded = btoa(String.fromCharCode.apply(null, new Uint8Array(source)));
  return encoded.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

async function signJwt(clientEmail, privateKey) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Parse PEM securely handling different env var formats
  let pem = privateKey.replace(/\\n/g, '\n');
  if (pem.startsWith('"') && pem.endsWith('"')) {
    pem = pem.slice(1, -1);
  }
  
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  
  if (!pem.includes(pemHeader) || !pem.includes(pemFooter)) {
    throw new Error('Invalid FIREBASE_PRIVATE_KEY format. Must include BEGIN/END PRIVATE KEY headers.');
  }

  pem = pem.substring(pem.indexOf(pemHeader) + pemHeader.length, pem.indexOf(pemFooter));
  pem = pem.replace(/\s/g, '');
  
  const binaryDerString = atob(pem);
  const binaryDer = str2ab(binaryDerString);

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64url(signature);
  return `${unsignedToken}.${encodedSignature}`;
}

let cachedToken = null;
let tokenExp = 0;

export async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExp) {
    return cachedToken;
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY');
  }

  const jwt = await signJwt(clientEmail, privateKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`OAuth error: ${data.error_description}`);
  }

  cachedToken = data.access_token;
  tokenExp = Date.now() + (data.expires_in - 60) * 1000; // refresh 60s early
  return cachedToken;
}

// Convert Firestore REST document to normal JSON
export function firestoreToJSON(fields) {
  const result = {};
  for (const [key, val] of Object.entries(fields)) {
    if ('stringValue' in val) result[key] = val.stringValue;
    else if ('integerValue' in val) result[key] = parseInt(val.integerValue, 10);
    else if ('doubleValue' in val) result[key] = val.doubleValue;
    else if ('booleanValue' in val) result[key] = val.booleanValue;
    else if ('timestampValue' in val) result[key] = val.timestampValue;
    else if ('arrayValue' in val) result[key] = val.arrayValue.values ? val.arrayValue.values.map(v => firestoreToJSON({_: v})._) : [];
    else if ('mapValue' in val) result[key] = firestoreToJSON(val.mapValue.fields || {});
    else if ('nullValue' in val) result[key] = null;
  }
  return result;
}

export async function getDocument(collection, id) {
  const token = await getAccessToken();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore get error: ${await res.text()}`);
  
  const data = await res.json();
  return firestoreToJSON(data.fields || {});
}

export async function updateDocumentStatus(collection, id, status) {
  const token = await getAccessToken();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${id}?updateMask.fieldPaths=status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        status: { stringValue: status }
      }
    })
  });

  if (!res.ok) throw new Error(`Firestore update error: ${await res.text()}`);
  return true;
}
