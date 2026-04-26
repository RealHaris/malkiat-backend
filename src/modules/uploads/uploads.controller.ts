import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { z } from 'zod';

import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import { UploadsService, uploadConstraints } from './uploads.service';
import type { UploadedFileLike } from './uploads.types';
import { uploadTypes } from './uploads.types';

const uploadBodySchema = z.object({
  type: z.enum(uploadTypes),
});

type UploadBodyDto = z.infer<typeof uploadBodySchema>;

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async upload(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(uploadBodySchema)) body: UploadBodyDto,
    @UploadedFiles() files: UploadedFileLike[],
  ) {
    const normalizedFiles = files ?? [];

    if (body.type === 'listing') {
      const listingFiles = normalizedFiles.filter((file) => file.fieldname === 'files');

      if (listingFiles.length === 0) {
        throw new BadRequestException('At least one listing file is required');
      }

      if (listingFiles.length > uploadConstraints.maxListingFiles) {
        throw new BadRequestException(
          `Maximum ${uploadConstraints.maxListingFiles} files are allowed`,
        );
      }

      if (normalizedFiles.some((file) => file.fieldname !== 'files')) {
        throw new BadRequestException('Listing uploads must use the files field');
      }

      const items = await Promise.all(
        listingFiles.map((file) =>
          this.uploadsService.uploadFile({
            type: body.type,
            userId: session.user.id,
            file,
          }),
        ),
      );

      return { type: body.type, items };
    }

    const singleFiles = normalizedFiles.filter((file) => file.fieldname === 'file');

    if (singleFiles.length !== 1 || normalizedFiles.length !== 1) {
      throw new BadRequestException(`Upload type ${body.type} requires exactly one file field`);
    }

    const item = await this.uploadsService.uploadFile({
      type: body.type,
      userId: session.user.id,
      file: singleFiles[0],
    });

    return { type: body.type, item };
  }
}
