import { z } from 'zod';
import { UuidSchema } from './primitives';

/**
 * Cloudinary direct-upload signing contract. Frontend asks for a signature,
 * uploads direct to Cloudinary, then submits the resulting `ProductImageRef`
 * back to product create/update. The backend never sees the bytes.
 *
 * Server pins `folder` + `public_id_prefix` to the requesting user, so the
 * resulting `publicId` is provably seller-scoped — server-side validation of
 * the `ProductImageRef.publicId` against this pattern is the ownership check.
 */

export const UPLOAD_PURPOSES = ['product_image'] as const;
export const UploadPurposeSchema = z.enum(UPLOAD_PURPOSES);
export type UploadPurpose = z.infer<typeof UploadPurposeSchema>;

export const SignUploadRequestSchema = z.object({
  purpose: UploadPurposeSchema,
});
export type SignUploadRequest = z.infer<typeof SignUploadRequestSchema>;

/**
 * Returned to the client. The client posts a multipart form to
 * `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` with these
 * fields plus the file. Cloudinary echoes back `secure_url`, `public_id`,
 * `width`, `height`, `bytes` — those become the `ProductImageRef`.
 */
export const SignUploadResponseSchema = z.object({
  cloudName: z.string().min(1),
  apiKey: z.string().min(1),
  timestamp: z.number().int().positive(),
  signature: z.string().min(1),
  folder: z.string().min(1),
  publicId: z.string().min(1),
  uploadUrl: z.string().url(),
  /** Echoed back for the ownership check on subsequent product writes. */
  ownerUserId: UuidSchema,
});
export type SignUploadResponse = z.infer<typeof SignUploadResponseSchema>;
