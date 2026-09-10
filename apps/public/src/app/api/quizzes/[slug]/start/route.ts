import { randomUUID, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getPublishedQuizBySlug, createQuizAttempt, checkRateLimit, getClientIp } from '@quizmania/shared';

export const dynamic = 'force-dynamic';

interface StartAttemptBody {
  participant_name: string;
  participant_email?: string | null;
  participant_data?: Record<string, any> | null;
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`start:${clientIp}`, 30, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Too many attempt requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    let body: StartAttemptBody;
    try {
      body = (await req.json()) as StartAttemptBody;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const slug = params.slug;

    if (!body || typeof body !== 'object' || !body.participant_name || typeof body.participant_name !== 'string' || !body.participant_name.trim()) {
      return NextResponse.json({ success: false, error: 'Participant name is required' }, { status: 400 });
    }

    if (body.participant_name.length > 100) {
      return NextResponse.json({ success: false, error: 'Participant name exceeds maximum length of 100 characters' }, { status: 400 });
    }

    if (body.participant_email && (typeof body.participant_email !== 'string' || body.participant_email.length > 255)) {
      return NextResponse.json({ success: false, error: 'Participant email is invalid' }, { status: 400 });
    }

    const quiz = await getPublishedQuizBySlug(slug);
    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found or not published' }, { status: 404 });
    }

    const availability = quiz.availability;
    if (availability) {
      if (availability.status === 'upcoming') {
        return NextResponse.json({
          success: false,
          status: 'upcoming',
          message: availability.message || 'This quiz has not started yet.',
          startsAt: availability.startsAt || quiz.start_at
        }, { status: 409 });
      }

      if (availability.status === 'expired') {
        return NextResponse.json({
          success: false,
          status: 'expired',
          message: availability.message || 'This quiz has expired.',
          endsAt: availability.endsAt || quiz.end_at
        }, { status: 410 });
      }

      if (!availability.isAvailable) {
        return NextResponse.json({
          success: false,
          status: availability.status,
          message: availability.message || 'Quiz is currently unavailable.'
        }, { status: 403 });
      }
    }

    // Classification: SECURITY-SENSITIVE
    // Cryptographically secure session token prevents attempt spoofing, prediction, or hijacking
    const sessionToken = `attempt_${randomBytes(24).toString('hex')}`;
    // Cryptographically secure primary key identifier for the attempt
    const attemptId = randomUUID();
    const startedAt = new Date().toISOString();

    let expiresAt: string | null = null;
    const isTimerEnabled = quiz.settings?.features?.timer !== false;
    const timeLimitMinutes = quiz.settings?.time_limit_minutes;
    const timeLimitSeconds = quiz.settings?.time_limit_seconds ?? (timeLimitMinutes && timeLimitMinutes > 0 ? timeLimitMinutes * 60 : null);
    if (isTimerEnabled && timeLimitSeconds && timeLimitSeconds > 0) {
      const expires = new Date(new Date(startedAt).getTime() + timeLimitSeconds * 1000);
      expiresAt = expires.toISOString();
    }

    // Persist attempt deterministically (Supabase if live, mockStore otherwise)
    await createQuizAttempt({
      id: attemptId,
      quiz_id: quiz.id,
      session_token: sessionToken,
      participant_name: body.participant_name,
      participant_email: body.participant_email || null,
      participant_data: body.participant_data || {},
      started_at: startedAt,
      expires_at: expiresAt,
      submitted_at: null,
      status: 'in_progress'
    });

    return NextResponse.json({
      success: true,
      attemptId,
      sessionToken,
      startedAt,
      expiresAt,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
