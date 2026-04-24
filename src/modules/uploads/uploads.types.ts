export const uploadTypes = ['listing', 'user_profile', 'agency_profile', 'agency_cover'] as const;

export type UploadType = (typeof uploadTypes)[number];

export type UploadedFileLike = {
  fieldname: string;
  mimetype: string;
  size: number;
  originalname: string;
  buffer: Buffer;
};

export type UploadItem = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  originalFilename: string;
  storedFilename: string;
  folder: string;
};
