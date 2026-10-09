import { NextResponse } from 'next/server';
import { getDocument, updateDocumentStatus } from '@/lib/edgeFirebase';

export const runtime = 'edge';

export async function POST(request) {
  try {
    const { trackingCode, newStatus } = await request.json();

    if (!trackingCode) {
      return NextResponse.json({ success: false, message: 'Missing tracking code' }, { status: 400 });
    }

    if (newStatus && !['PUBLIC_VERIFIED', 'HEATMAP_AGGREGATED', 'ACTION_IGNORED'].includes(newStatus)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      return NextResponse.json({ success: true });
    }

    // 1. Authenticate the request by finding the secret document
    const secretDoc = await getDocument('report_secrets', trackingCode);

    if (!secretDoc) {
      return NextResponse.json({ success: false, message: 'Invalid tracking code' }, { status: 403 });
    }

    const reportId = secretDoc.reportId;

    // 2. Update the actual report data
    await updateDocumentStatus('reports', reportId, newStatus || 'ACTION_IGNORED');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
