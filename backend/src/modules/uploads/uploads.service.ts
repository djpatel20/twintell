import { supabaseAdmin } from '../../lib/supabase';
import { SignUploadInput } from './uploads.schema';
import { AppError } from '../../middleware/error-handler';
import { logger } from '../../lib/logger';

export class UploadsService {
  /**
   * Generates a signed upload URL to upload directly to Supabase Storage.
   */
  async getSignedUploadUrl(userId: string, input: SignUploadInput) {
    const { fileName, fileType } = input;
    const extension = fileName.split('.').pop() || 'jpg';
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `posts/${userId}/${Date.now()}-${cleanFileName}`;

    try {
      const { data, error } = await supabaseAdmin.storage
        .from('twintell-uploads')
        .createSignedUploadUrl(storagePath);

      if (error) {
        logger.error({ error: error.message }, 'Failed to create signed upload URL from Supabase Storage');
        throw new AppError('Failed to generate upload URL. Please check storage bucket configuration.', 500, 'STORAGE_ERROR');
      }

      const { data: publicData } = supabaseAdmin.storage
        .from('twintell-uploads')
        .getPublicUrl(storagePath);

      return {
        uploadUrl: data.signedUrl,
        publicUrl: publicData.publicUrl,
        filePath: storagePath,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error({ err: err?.message }, 'Unexpected storage service error');
      throw new AppError(err?.message || 'Storage service unavailable.', 500, 'STORAGE_ERROR');
    }
  }
}

export const uploadsService = new UploadsService();
