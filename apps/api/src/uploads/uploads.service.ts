import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import type { SignUploadRequest, SignUploadResponse } from '@auction/shared';
import { AppException } from '../common';
import { EnvService } from '../config/env.service';
import { sellerImageFolder } from './asset-ownership';

/**
 * Issues short-lived signed parameters for direct-to-Cloudinary upload.
 * The backend never receives the file. Resulting `publicId` is pinned to
 * `auction/seller-{userId}/{uuid}` so ownership can be verified server-side
 * later (see `asset-ownership.ts`).
 */
@Injectable()
export class UploadsService {
  constructor(private readonly env: EnvService) {
    const cfg = env.config;
    if (cfg.CLOUDINARY_CLOUD_NAME && cfg.CLOUDINARY_API_KEY && cfg.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: cfg.CLOUDINARY_CLOUD_NAME,
        api_key: cfg.CLOUDINARY_API_KEY,
        api_secret: cfg.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
  }

  signForUser(args: { userId: string; request: SignUploadRequest }): SignUploadResponse {
    const cfg = this.env.config;
    if (!cfg.CLOUDINARY_CLOUD_NAME || !cfg.CLOUDINARY_API_KEY || !cfg.CLOUDINARY_API_SECRET) {
      throw AppException.unprocessable(
        'upload.not_configured',
        'Image upload is not configured on the server',
      );
    }

    // Each request mints a fresh public_id; Cloudinary will use the signed value.
    const folder = sellerImageFolder(cfg.CLOUDINARY_UPLOAD_FOLDER, args.userId);
    const publicId = `${folder}/${randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000);

    // Cloudinary signs the alphabetical concat of `key=value&...` excluding api_key/file/cloud_name.
    const signature = cloudinary.utils.api_sign_request(
      { folder, public_id: publicId, timestamp },
      cfg.CLOUDINARY_API_SECRET,
    );

    return {
      cloudName: cfg.CLOUDINARY_CLOUD_NAME,
      apiKey: cfg.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
      publicId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cfg.CLOUDINARY_CLOUD_NAME}/image/upload`,
      ownerUserId: args.userId,
    };
  }
}
