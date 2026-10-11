import { NextResponse } from 'next/server';
import { getDocument, updateDocumentStatus } from '@/lib/edgeFirebase';

const TRACKING_CODE_REGEX = /^[A-Za-z0-9_-]{5,64}$/;
const ALLOWED_STATUSES = new Set(['PUBLIC_VERIFIED', 'HEATMAP_AGGREGATED', 'ACTION_IGNORED']);

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 400 });
    }

    const { trackingCode, newStatus } = body || {};

    if (!trackingCode || typeof trackingCode !== 'string') {
      return NextResponse.json({ success: false, message: 'Missing tracking code' }, { status: 400 });
    }

    const trimmedCode = trackingCode.trim();
    if (!TRACKING_CODE_REGEX.test(trimmedCode)) {
      return NextResponse.json({ success: false, message: 'Invalid tracking code format' }, { status: 400 });
    }

    if (!newStatus || !ALLOWED_STATUSES.has(newStatus)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      return NextResponse.json({ success: true });
    }

    // 1. Authenticate the request by finding the secret document
    const secretDoc = await getDocument('report_secrets', trimmedCode);

    if (!secretDoc || !secretDoc.reportId) {
      return NextResponse.json({ success: false, message: 'Invalid tracking code' }, { status: 403 });
    }

    const reportId = secretDoc.reportId;
    if (typeof reportId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(reportId)) {
      return NextResponse.json({ success: false, message: 'Malformed report reference' }, { status: 500 });
    }

    // 2. Update the actual report data
    await updateDocumentStatus('reports', reportId, newStatus);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
