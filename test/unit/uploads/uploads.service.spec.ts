import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { put } from '@vercel/blob';

import { UploadsService, buildStoredFilename } from '@modules/uploads/uploads.service';

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}));

describe('UploadsService', () => {
  const putMock = put as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds stored filenames with epoch, 5-char uuid token, sanitized slug, and extension', () => {
    const filename = buildStoredFilename(
      'House Front 12!!.jpeg',
      new Date('2026-04-25T00:00:00.000Z'),
      'abcde12345-0000-0000-0000-000000000000',
    );

    expect(filename).toBe('1777075200abcdehousefront.jpg');
  });

  it('trims long slugs and falls back to image when sanitization removes everything', () => {
    expect(
      buildStoredFilename(
        '12345 !!!.png',
        new Date('2026-04-25T00:00:00.000Z'),
        'fghij12345-0000-0000-0000-000000000000',
      ),
    ).toBe('1777075200fghijimage.png');
    expect(
      buildStoredFilename(
        'This filename should definitely be much longer than twenty four chars.webp',
        new Date('2026-04-25T00:00:00.000Z'),
        'fghij12345-0000-0000-0000-000000000000',
      ),
    ).toBe('1777075200fghijthisfilenameshoulddefini.webp');
  });

  it('uploads to vercel blob with the mapped folder and returns normalized metadata', async () => {
    putMock.mockResolvedValue({
      url: 'https://blob.example/listings/user-1/generated.jpg',
      pathname: 'listings/user-1/generated.jpg',
    } as any);

    const service = new UploadsService({ BLOB_READ_WRITE_TOKEN: 'blob-token' } as any);
    const result = await service.uploadFile({
      type: 'listing',
      userId: 'user-1',
      file: {
        fieldname: 'files',
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'House Front 12.jpg',
        buffer: Buffer.from('test'),
      },
    });

    expect(putMock).toHaveBeenCalledWith(
      expect.stringMatching(/^listings\/user-1\/\d{10}[a-z0-9]{5}housefront\.jpg$/),
      expect.any(Buffer),
      expect.objectContaining({
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/jpeg',
        token: 'blob-token',
      }),
    );
    expect(result).toEqual({
      url: 'https://blob.example/listings/user-1/generated.jpg',
      pathname: 'listings/user-1/generated.jpg',
      contentType: 'image/jpeg',
      size: 1024,
      originalFilename: 'House Front 12.jpg',
      storedFilename: expect.stringMatching(/^\d{10}[a-z0-9]{5}housefront\.jpg$/),
      folder: 'listings',
    });
  });

  it('rejects uploads when blob storage is not configured', async () => {
    const service = new UploadsService({} as any);

    await expect(
      service.uploadFile({
        type: 'user_profile',
        userId: 'user-1',
        file: {
          fieldname: 'file',
          mimetype: 'image/png',
          size: 100,
          originalname: 'avatar.png',
          buffer: Buffer.from('test'),
        },
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects unsupported mime types and oversize files', async () => {
    const service = new UploadsService({ BLOB_READ_WRITE_TOKEN: 'blob-token' } as any);

    await expect(
      service.uploadFile({
        type: 'user_profile',
        userId: 'user-1',
        file: {
          fieldname: 'file',
          mimetype: 'image/gif',
          size: 100,
          originalname: 'avatar.gif',
          buffer: Buffer.from('test'),
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.uploadFile({
        type: 'user_profile',
        userId: 'user-1',
        file: {
          fieldname: 'file',
          mimetype: 'image/png',
          size: 4 * 1024 * 1024 + 1,
          originalname: 'avatar.png',
          buffer: Buffer.from('test'),
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
