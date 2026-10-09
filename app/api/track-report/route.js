import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/edgeFirebase';
import mockData from '@/src/data/mockReports.json';

export const runtime = 'edge';

export async function POST(request) {
  try {
    const { trackingCode } = await request.json();

    if (!trackingCode) {
      return NextResponse.json({ success: false, message: 'Missing tracking code' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      try {
        const found = mockData.find(r => r.trackingCode === trackingCode);
        if (found) {
          return NextResponse.json({ success: true, report: { ...found, _docId: found.id } });
        } else {
          return NextResponse.json({ success: false, message: 'Invalid tracking code' }, { status: 404 });
        }
      } catch (e) {
        console.error('Mock data error:', e);
      }
    }

    // 1. Fetch the secret document via REST API
    const secretDoc = await getDocument('report_secrets', trackingCode);

    if (!secretDoc) {
      return NextResponse.json({ success: false, message: 'Invalid tracking code' }, { status: 404 });
    }

    const reportId = secretDoc.reportId;

    // 2. Fetch the actual report data via REST API
    const reportData = await getDocument('reports', reportId);

    if (!reportData) {
      return NextResponse.json({ success: false, message: 'Report data missing' }, { status: 404 });
    }

    return NextResponse.json({ success: true, report: { ...reportData, _docId: reportId, trackingCode } });

  } catch (error) {
    console.error('Error tracking report:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
