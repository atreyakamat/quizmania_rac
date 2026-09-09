import { NextRequest, NextResponse } from 'next/server';
import { adminJsonResponse, requireAuthenticatedAdmin, unauthorizedResponse } from '../../../lib/auth';
import { checkRateLimit, getClientIp, getSupabaseAdminClient, isSupabaseConfigured } from '@quizmania/shared';
import type { StorageBucket } from '@quizmania/shared';

export const dynamic = 'force-dynamic';

const ALLOWED_BUCKETS: StorageBucket[] = ['quiz-covers', 'question-images', 'option-images', 'branding-assets'];

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg'
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Admin Secure Image Upload Route.
 * Strictly protected: Requires active authenticated admin session with explicit admin_users authorization.
 * Enforces CSRF verification, rate limiting, bucket whitelist, MIME verification, size limits, and sanitized paths.
 */
export async function POST(request: NextRequest) {
  // 1. Rate Limiting: 30 uploads per minute per IP
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`upload:${clientIp}`, 30, 60000);
  if (!rateCheck.success) {
    return NextResponse.json(
      { success: false, error: 'Too many upload requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // 2. Authentication & CSRF Origin Verification
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as StorageBucket | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided for upload' },
        { status: 400 }
      );
    }

    if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { success: false, error: `Invalid storage bucket. Allowed: ${ALLOWED_BUCKETS.join(', ')}` },
        { status: 400 }
      );
    }

    // 3. File Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Uploaded file is empty' },
        { status: 400 }
      );
    }

    // 4. MIME Type & Extension Whitelist Verification
    const mimeType = file.type.toLowerCase();
    const expectedExt = ALLOWED_MIME_TYPES[mimeType];
    if (!expectedExt) {
      return NextResponse.json(
        { success: false, error: `Disallowed file type: "${mimeType}". Only JPG, PNG, WebP, GIF, and SVG images are allowed.` },
        { status: 400 }
      );
    }

    // 5. Generate Safe, Non-Colliding Filename (Path Traversal Protection)
    const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 12)
      : Math.random().toString(36).substring(2, 14);
    const safeBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const cleanFileName = `${Date.now()}-${safeBaseName}-${randomSuffix}.${expectedExt}`;

    // 6. Check Storage Configuration
    if (!isSupabaseConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Storage backend is not configured in production environment' },
          { status: 500 }
        );
      }
      // Mock / local development response
      const fakeUrl = `data:${mimeType};base64,mock-upload-data`;
      return adminJsonResponse({
        success: true,
        url: fakeUrl,
        path: `local/${bucket}/${cleanFileName}`
      }, auth);
    }

    // 7. Privileged Server-Side Upload to Supabase Storage
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      if (process.env.NODE_ENV !== 'production') {
        const fakeUrl = `data:${mimeType};base64,mock-upload-data`;
        return adminJsonResponse({
          success: true,
          url: fakeUrl,
          path: `local/${bucket}/${cleanFileName}`
        }, auth);
      }
      return NextResponse.json(
        { success: false, error: 'Storage client unavailable' },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(cleanFileName, buffer, {
        contentType: mimeType,
        cacheControl: '31536000',
        upsert: false
      });

    if (error) {
      return NextResponse.json(
        { success: false, error: `Storage upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return adminJsonResponse({
      success: true,
      url: publicUrlData.publicUrl,
      path: data.path
    }, auth);
  } catch (err) {
    console.error('Image upload handler error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal server error during upload' },
      { status: 500 }
    );
  }
}
