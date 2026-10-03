import { z } from 'zod';

export const signUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif'], {
    errorMap: () => ({ message: 'Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF' }),
  }),
  fileSize: z
    .number()
    .max(5 * 1024 * 1024, 'File size must not exceed 5MB')
    .min(1, 'File cannot be empty'),
});

export type SignUploadInput = z.infer<typeof signUploadSchema>;
