import { api } from './api-client';

/**
 * Uploads a file directly to Supabase Storage using twintell's signed upload URL endpoint.
 * Returns the permanent public CDN URL for the uploaded file.
 */
export async function uploadFileToStorage(file: File): Promise<string> {
  // 1. Get signed upload URL from backend
  const signRes = await api.post<{ uploadUrl: string; publicUrl: string; filePath: string }>(
    '/api/uploads/sign',
    {
      fileName: file.name,
      fileType: file.type || 'image/jpeg',
    }
  );

  // 2. Upload file directly via HTTP PUT to storage
  const uploadRes = await fetch(signRes.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'image/jpeg',
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload "${file.name}" to cloud storage.`);
  }

  return signRes.publicUrl;
}
