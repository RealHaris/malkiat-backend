import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

import { APP_ENV } from '@shared/config/config.constants';
import type { AppEnv } from '@shared/config/env';
import type { UploadItem, UploadedFileLike, UploadType } from './uploads.types';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

const uploadTypeFolderMap: Record<UploadType, string> = {
  listing: 'listings',
  user_profile: 'users',
  agency_profile: 'agencies',
  agency_cover: 'agencies-covers',
};

@Injectable()
export class UploadsService {
  constructor(@Inject(APP_ENV) private readonly env: AppEnv) {}

  async uploadFile(input: {
    type: UploadType;
    userId: string;
    file: UploadedFileLike;
  }): Promise<UploadItem> {
    this.assertBlobConfigured();
    this.assertFileIsValid(input.file);

    const folder = uploadTypeFolderMap[input.type];
    const storedFilename = buildStoredFilename(input.file.originalname);
    const pathname = `${folder}/${input.userId}/${storedFilename}`;

    const blob = await put(pathname, input.file.buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: input.file.mimetype,
      token: this.env.BLOB_READ_WRITE_TOKEN,
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: input.file.mimetype,
      size: input.file.size,
      originalFilename: input.file.originalname,
      storedFilename,
      folder,
    };
  }

  private assertBlobConfigured() {
    if (!this.env.BLOB_READ_WRITE_TOKEN) {
      throw new ServiceUnavailableException('Blob storage is not configured');
    }
  }

  private assertFileIsValid(file: UploadedFileLike) {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException(`File too large: ${file.originalname}`);
    }
  }
}

export function buildStoredFilename(
  originalName: string,
  now = new Date(),
  uuid = randomUUID(),
): string {
  const epoch = Math.floor(now.getTime() / 1000).toString();
  const token = uuid.replace(/-/g, '').slice(0, 5).toLowerCase();
  const extension = resolveExtension(originalName);
  const slug = sanitizeFilenameSlug(originalName);

  return `${epoch}${token}${slug}${extension}`;
}

function resolveExtension(originalName: string): string {
  const normalized = originalName.trim().toLowerCase();
  const lastDotIndex = normalized.lastIndexOf('.');

  if (lastDotIndex < 0) return '.jpg';

  const extension = normalized.slice(lastDotIndex);
  if (extension === '.jpeg' || extension === '.jpg') return '.jpg';
  if (extension === '.png') return '.png';
  if (extension === '.webp') return '.webp';

  throw new BadRequestException(`Unsupported file extension: ${extension}`);
}

function sanitizeFilenameSlug(originalName: string): string {
  const basename = originalName.includes('.')
    ? originalName.slice(0, originalName.lastIndexOf('.'))
    : originalName;
  const slug = basename
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[0-9]/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 24);

  return slug || 'image';
}

export const uploadConstraints = {
  allowedImageMimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
  maxImageSizeBytes: MAX_IMAGE_SIZE_BYTES,
  maxListingFiles: 5,
} as const;
