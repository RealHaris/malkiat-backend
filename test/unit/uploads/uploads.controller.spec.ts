import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  Session: () => (_target: object, _key: string | symbol | undefined, _index: number) => undefined,
}));

import { UploadsController } from '@modules/uploads/uploads.controller';
import type { UploadItem } from '@modules/uploads/uploads.types';

describe('UploadsController', () => {
  const session = {
    user: { id: 'user-1' },
  } as any;

  let controller: UploadsController;
  let uploadsService: { uploadFile: jest.MockedFunction<(input: unknown) => Promise<UploadItem>> };

  beforeEach(() => {
    uploadsService = {
      uploadFile: jest.fn(),
    };
    controller = new UploadsController(uploadsService as any);
  });

  it('uploads up to five listing files and returns items', async () => {
    uploadsService.uploadFile
      .mockResolvedValueOnce({
        url: 'https://blob.example/1',
        pathname: 'listings/user-1/1.jpg',
        contentType: 'image/jpeg',
        size: 10,
        originalFilename: 'one.jpg',
        storedFilename: '1.jpg',
        folder: 'listings',
      })
      .mockResolvedValueOnce({
        url: 'https://blob.example/2',
        pathname: 'listings/user-1/2.jpg',
        contentType: 'image/jpeg',
        size: 12,
        originalFilename: 'two.jpg',
        storedFilename: '2.jpg',
        folder: 'listings',
      });

    const response = await controller.upload(session, { type: 'listing' }, [
      {
        fieldname: 'files',
        mimetype: 'image/jpeg',
        size: 10,
        originalname: 'one.jpg',
        buffer: Buffer.from('1'),
      },
      {
        fieldname: 'files',
        mimetype: 'image/jpeg',
        size: 12,
        originalname: 'two.jpg',
        buffer: Buffer.from('2'),
      },
    ]);

    expect(uploadsService.uploadFile).toHaveBeenCalledTimes(2);
    expect(response).toEqual({
      type: 'listing',
      items: [
        expect.objectContaining({ url: 'https://blob.example/1' }),
        expect.objectContaining({ url: 'https://blob.example/2' }),
      ],
    });
  });

  it('rejects listing uploads with missing files, too many files, or wrong field names', async () => {
    await expect(controller.upload(session, { type: 'listing' }, [])).rejects.toBeInstanceOf(
      BadRequestException,
    );

    await expect(
      controller.upload(
        session,
        { type: 'listing' },
        Array.from({ length: 6 }, (_, index) => ({
          fieldname: 'files',
          mimetype: 'image/jpeg',
          size: index + 1,
          originalname: `file-${index}.jpg`,
          buffer: Buffer.from('x'),
        })),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.upload(session, { type: 'listing' }, [
        {
          fieldname: 'file',
          mimetype: 'image/jpeg',
          size: 10,
          originalname: 'wrong.jpg',
          buffer: Buffer.from('x'),
        },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploads exactly one single-image file and returns item', async () => {
    uploadsService.uploadFile.mockResolvedValue({
      url: 'https://blob.example/avatar',
      pathname: 'users/user-1/avatar.png',
      contentType: 'image/png',
      size: 10,
      originalFilename: 'avatar.png',
      storedFilename: 'avatar.png',
      folder: 'users',
    });

    const response = await controller.upload(session, { type: 'user_profile' }, [
      {
        fieldname: 'file',
        mimetype: 'image/png',
        size: 10,
        originalname: 'avatar.png',
        buffer: Buffer.from('x'),
      },
    ]);

    expect(uploadsService.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'user_profile',
        userId: 'user-1',
      }),
    );
    expect(response).toEqual({
      type: 'user_profile',
      item: expect.objectContaining({ url: 'https://blob.example/avatar' }),
    });
  });

  it('rejects single-image types when the request does not contain exactly one file field', async () => {
    await expect(controller.upload(session, { type: 'agency_profile' }, [])).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      controller.upload(session, { type: 'agency_cover' }, [
        {
          fieldname: 'files',
          mimetype: 'image/png',
          size: 10,
          originalname: 'cover.png',
          buffer: Buffer.from('x'),
        },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      controller.upload(session, { type: 'agency_profile' }, [
        {
          fieldname: 'file',
          mimetype: 'image/png',
          size: 10,
          originalname: 'a.png',
          buffer: Buffer.from('x'),
        },
        {
          fieldname: 'file',
          mimetype: 'image/png',
          size: 11,
          originalname: 'b.png',
          buffer: Buffer.from('y'),
        },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
