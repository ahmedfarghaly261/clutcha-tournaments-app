import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

export type TournamentPaymentProofFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

const maxProofBytes = 10 * 1024 * 1024;

const allowedExtensionsByMimeType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

@Injectable()
export class TournamentPaymentProofStorageService {
  async saveProofFile(
    registrationId: string,
    file: TournamentPaymentProofFile | undefined,
    publicOrigin: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Payment proof file is required');
    }

    if (file.size > maxProofBytes) {
      throw new BadRequestException('Payment proof must be 10MB or smaller');
    }

    const extension = this.resolveExtension(file);
    const relativeDirectory = join('payment-proofs', registrationId);
    const uploadsDirectory = join(process.cwd(), 'uploads', relativeDirectory);
    const filename = `proof-${randomUUID()}${extension}`;

    await mkdir(uploadsDirectory, { recursive: true });
    await writeFile(join(uploadsDirectory, filename), file.buffer);

    const publicPath = `/uploads/${relativeDirectory.replaceAll('\\', '/')}/${filename}`;
    return `${publicOrigin}${publicPath}`;
  }

  private resolveExtension(file: TournamentPaymentProofFile): string {
    const extension = allowedExtensionsByMimeType[file.mimetype];
    if (extension) return extension;

    const fallbackExtension = extname(file.originalname).toLowerCase();
    if (
      ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(fallbackExtension)
    ) {
      throw new BadRequestException(
        'Payment proof type must be JPEG, PNG, WebP, or PDF',
      );
    }

    throw new BadRequestException(
      'Payment proof type must be JPEG, PNG, WebP, or PDF',
    );
  }
}
