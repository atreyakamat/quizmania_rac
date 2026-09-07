import { getSupabaseAdminClient, getSupabasePublicClient, isSupabaseConfigured } from './supabase';

export type StorageBucket = 'quiz-covers' | 'question-images' | 'option-images' | 'branding-assets';

export const STORAGE_BUCKETS: Record<string, StorageBucket> = {
  QUIZ_COVERS: 'quiz-covers',
  QUESTION_IMAGES: 'question-images',
  OPTION_IMAGES: 'option-images',
  BRANDING_ASSETS: 'branding-assets'
};

/**
 * Uploads an image file to the designated Supabase Storage bucket.
 * Returns the public URL or relative storage path.
 */
export async function uploadImage(
  bucket: StorageBucket,
  file: File | Blob,
  fileName: string
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'Storage backend is not configured in production environment.' };
    }
    // Return a dummy object URL or placeholder for local dev without live bucket
    const fakeUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(file)
      : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd" width="100" height="100"/></svg>`;
    return {
      success: true,
      url: fakeUrl,
      path: `local/${bucket}/${fileName}`
    };
  }

  const supabase = getSupabaseAdminClient() || getSupabasePublicClient();
  if (!supabase) {
    return { success: false, error: 'Storage client is not initialized' };
  }

  const cleanFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(cleanFileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    success: true,
    url: publicUrlData.publicUrl,
    path: data.path
  };
}

/**
 * Retrieve public image URL from bucket and path.
 */
export function getStorageImageUrl(bucket: StorageBucket, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path;
  }
  const supabase = getSupabasePublicClient();
  if (!supabase) return path;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
