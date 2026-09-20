import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const { trackingCode } = await request.json();

    if (!trackingCode) {
      return NextResponse.json({ success: false, message: 'Missing tracking code' }, { status: 400 });
    }

    // 1. Authenticate the request by finding the secret document
    const secretsSnapshot = await adminDb.collection('report_secrets').where('trackingCode', '==', trackingCode).limit(1).get();

    if (secretsSnapshot.empty) {
      return NextResponse.json({ success: false, message: 'Invalid tracking code' }, { status: 403 });
    }

    const reportId = secretsSnapshot.docs[0].id;

    // 2. Update the actual report data
    await adminDb.collection('reports').doc(reportId).update({
      status: 'ACTION_IGNORED'
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
