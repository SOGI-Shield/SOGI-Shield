import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, message: 'Missing Turnstile token' }, { status: 400 });
    }

    // In development or mock mode, automatically pass verification for seamless local testing
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      return NextResponse.json({ success: true, message: 'Dev/Mock mode verification bypassed' });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error("CRITICAL: Turnstile secret key is missing in production.");
      return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
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
