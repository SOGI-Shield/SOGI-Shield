import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/edgeFirebase';

export const runtime = 'edge';

const TRACKING_CODE_REGEX = /^[A-Za-z0-9_-]{5,64}$/;

// Short-lived in-memory cache to throttle repeated Firestore reads for the same code
const trackCache = new Map();
const TRACK_CACHE_TTL = 30000; // 30 seconds

export function invalidateTrackCache(code) {
  if (code) trackCache.delete(code);
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 400 });
    }

    const trackingCode = body?.trackingCode;

    if (!trackingCode || typeof trackingCode !== 'string') {
      return NextResponse.json({ success: false, message: 'Missing tracking code' }, { status: 400 });
    }

    const trimmedCode = trackingCode.trim();
    if (!TRACKING_CODE_REGEX.test(trimmedCode)) {
      return NextResponse.json({ success: false, message: 'Invalid tracking code format' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      return NextResponse.json({ success: false, message: 'Mock mode should be handled on client' }, { status: 404 });
    }

    // Check short-lived cache
    const cached = trackCache.get(trimmedCode);
    if (cached && (Date.now() - cached.timestamp < TRACK_CACHE_TTL)) {
      return NextResponse.json(
        { success: true, report: cached.report },
        { headers: { 'Cache-Control': 'no-store, private' } }
      );
    }

    // 1. Fetch the secret document via REST API
    const secretDoc = await getDocument('report_secrets', trimmedCode);

    if (!secretDoc || !secretDoc.reportId) {
      return NextResponse.json({ success: false, message: 'Invalid tracking code' }, { status: 404 });
    }

    const reportId = secretDoc.reportId;
    if (typeof reportId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(reportId)) {
      return NextResponse.json({ success: false, message: 'Malformed report reference' }, { status: 500 });
    }

    // 2. Fetch the actual report data via REST API
    const reportData = await getDocument('reports', reportId);

    if (!reportData) {
      return NextResponse.json({ success: false, message: 'Report data missing' }, { status: 404 });
    }

    const reportPayload = { ...reportData, _docId: reportId, trackingCode: trimmedCode };
    
    // Save to cache
    trackCache.set(trimmedCode, { report: reportPayload, timestamp: Date.now() });

    return NextResponse.json(
      { success: true, report: reportPayload },
      { headers: { 'Cache-Control': 'no-store, private' } }
    );

  } catch (error) {
    console.error('Error tracking report:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
