import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { FilesInterceptor } from '@nestjs/platform-express';
import { put } from '@vercel/blob';
import { z } from 'zod';

import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';

const uploadListingMediaSchema = z.object({
  type: z.enum(['image']).optional().default('image'),
});

type UploadListingMediaDto = z.infer<typeof uploadListingMediaSchema>;

type UploadedFile = {
  mimetype: string;
  size: number;
  originalname: string;
  buffer: Buffer;
};

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 5;

@Controller('listings/media')
export class ListingMediaController {
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', MAX_FILES))
  async upload(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(uploadListingMediaSchema)) _dto: UploadListingMediaDto,
    @UploadedFiles() files: UploadedFile[],
  ) {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required');
    }

    if (files.length > MAX_FILES) {
      throw new BadRequestException(`Maximum ${MAX_FILES} files are allowed`);
    }

    const uploaded = await Promise.all(
      files.map(async (file, index) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
          throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          throw new BadRequestException(`File too large: ${file.originalname}`);
        }

        const ext = file.originalname.includes('.')
          ? file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase()
          : '.jpg';

        const filename = `listings/${session.user.id}/${Date.now()}-${index}${ext}`;
        const blob = await put(filename, file.buffer, {
          access: 'public',
          addRandomSuffix: true,
          contentType: file.mimetype,
        });

        return {
          url: blob.url,
          size: file.size,
          mimeType: file.mimetype,
          name: file.originalname,
        };
      }),
    );

    return { items: uploaded };
  }
}
