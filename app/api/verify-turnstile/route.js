import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, message: 'Missing Turnstile token' }, { status: 400 });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.warn("Turnstile secret key is not configured. Failing open for local testing, but this should be set in production.");
      return NextResponse.json({ success: true, message: 'Warning: Missing secret key. Bypassed verification.' });
    }

    const verifyData = new URLSearchParams();
    verifyData.append('secret', secretKey);
    verifyData.append('response', token);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: verifyData,
    });

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ success: true });
    } else {
      console.error("Turnstile verification failed:", data['error-codes']);
      return NextResponse.json({ success: false, message: 'Bot verification failed.' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error verifying turnstile token:', error);
    return NextResponse.json({ success: false, message: 'Server error during verification.' }, { status: 500 });
  }
}
