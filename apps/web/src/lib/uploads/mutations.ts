'use client';

import { useMutation } from '@tanstack/react-query';
import type { SignUploadRequest, SignUploadResponse, ProductImageRef } from '@auction/shared';
import { apiFetch } from '../api/client';
import { handleError } from '../errors/handle-error';

export function useSignUpload() {
  return useMutation({
    mutationFn: (purpose: SignUploadRequest['purpose']) =>
      apiFetch<SignUploadResponse>('/uploads/sign', {
        method: 'POST',
        json: { purpose },
      }),
    onError: (err) => handleError(err),
  });
}

export async function uploadToCloudinary(
  file: File,
  signatureData: SignUploadResponse
): Promise<ProductImageRef> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signatureData.apiKey);
  formData.append('timestamp', String(signatureData.timestamp));
  formData.append('signature', signatureData.signature);
  formData.append('folder', signatureData.folder);

  const res = await fetch(signatureData.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await res.json();
  
  return {
    publicId: data.public_id,
    url: data.secure_url,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
  };
}
