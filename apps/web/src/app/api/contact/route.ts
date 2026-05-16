import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Send email via a service like Resend, SendGrid, etc.
    // 2. Store in database
    // 3. Send notification to admin

    // For now, log the contact request
    console.log('[Contact Form]', {
      name,
      email: email || 'Not provided',
      phone: phone || 'Not provided',
      message,
      timestamp: new Date().toISOString(),
    });

    // Try to forward to the backend API if available
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
    if (apiUrl) {
      try {
        await fetch(`${apiUrl}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, message }),
        });
      } catch {
        // Ignore backend errors, still return success
      }
    }

    return NextResponse.json({ success: true, message: 'Message received' });
  } catch (error) {
    console.error('[Contact Form Error]', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}
