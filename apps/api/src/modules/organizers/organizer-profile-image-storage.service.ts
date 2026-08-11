import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

export type OrganizerProfileImageKind = 'logo' | 'cover';

export type OrganizerProfileImageFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

const maxImageBytes = 5 * 1024 * 1024;

const allowedImageExtensionsByMimeType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class OrganizerProfileImageStorageService {
  async saveProfileImage(
    userId: string,
    kind: OrganizerProfileImageKind,
    file: OrganizerProfileImageFile | undefined,
    publicOrigin: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (file.size > maxImageBytes) {
      throw new BadRequestException('Image file must be 5MB or smaller');
    }

    const extension = this.resolveImageExtension(file);
    const relativeDirectory = join('organizer-profiles', userId);
    const uploadsDirectory = join(process.cwd(), 'uploads', relativeDirectory);
    const filename = `${kind}-${randomUUID()}${extension}`;

    await mkdir(uploadsDirectory, { recursive: true });
    await writeFile(join(uploadsDirectory, filename), file.buffer);

    const publicPath = `/uploads/${relativeDirectory.replaceAll('\\', '/')}/${filename}`;
    return `${publicOrigin}${publicPath}`;
  }

  private resolveImageExtension(file: OrganizerProfileImageFile): string {
    const extension = allowedImageExtensionsByMimeType[file.mimetype];

    if (extension) {
      return extension;
    }

    const fallbackExtension = extname(file.originalname).toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.webp'].includes(fallbackExtension)) {
      throw new BadRequestException(
        'Image file type must be JPEG, PNG, or WebP',
      );
    }

    throw new BadRequestException('Image file type must be JPEG, PNG, or WebP');
  }
}
