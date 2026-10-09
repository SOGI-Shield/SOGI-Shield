import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { trackingCode } = await request.json();

    if (!trackingCode) {
      return NextResponse.json({ success: false, message: 'Missing tracking code' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      try {
        const mockFilePath = path.join(process.cwd(), 'src', 'data', 'mockReports.json');
        const mockData = JSON.parse(fs.readFileSync(mockFilePath, 'utf8'));
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

    const adminDb = await getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ success: false, message: 'Database initialization failed' }, { status: 500 });
    }

    // 1. Find the secret document with this tracking code
    const secretsSnapshot = await adminDb.collection('report_secrets').where('trackingCode', '==', trackingCode).limit(1).get();

    if (secretsSnapshot.empty) {
      return NextResponse.json({ success: false, message: 'Invalid tracking code' }, { status: 404 });
    }

    const secretDoc = secretsSnapshot.docs[0];
    const reportId = secretDoc.id;

    // 2. Fetch the actual report data
    const reportDoc = await adminDb.collection('reports').doc(reportId).get();

    if (!reportDoc.exists) {
      return NextResponse.json({ success: false, message: 'Report data missing' }, { status: 404 });
    }

    const reportData = reportDoc.data();
    
    // Pass back the reportId as _docId so the client knows what to update (or we can just use the trackingCode)
    return NextResponse.json({ success: true, report: { ...reportData, _docId: reportId, trackingCode } });

  } catch (error) {
    console.error('Error tracking report:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
