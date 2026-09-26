import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type TournamentCoverImageFile = {
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
export class TournamentCoverImageStorageService {
  async saveCoverImage(
    tournamentId: string,
    file: TournamentCoverImageFile | undefined,
    publicOrigin: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Tournament cover image is required');
    }

    if (file.size > maxImageBytes) {
      throw new BadRequestException(
        'Tournament cover image must be 5MB or smaller',
      );
    }

    const extension = allowedImageExtensionsByMimeType[file.mimetype];
    if (!extension) {
      throw new BadRequestException(
        'Tournament cover image type must be JPEG, PNG, or WebP',
      );
    }

    const relativeDirectory = join('tournaments', tournamentId);
    const uploadsDirectory = join(process.cwd(), 'uploads', relativeDirectory);
    const filename = `cover-${randomUUID()}${extension}`;

    await mkdir(uploadsDirectory, { recursive: true });
    await writeFile(join(uploadsDirectory, filename), file.buffer);

    const publicPath = `/uploads/${relativeDirectory.replaceAll('\\', '/')}/${filename}`;
    return `${publicOrigin}${publicPath}`;
  }
}
