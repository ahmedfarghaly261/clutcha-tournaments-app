import { BadRequestException } from '@nestjs/common';
import { TournamentCoverImageStorageService } from './tournament-cover-image-storage.service';

describe('TournamentCoverImageStorageService', () => {
  const service = new TournamentCoverImageStorageService();

  it('rejects a missing image', async () => {
    await expect(
      service.saveCoverImage(
        '1474ebf6-8e4b-4f40-9b43-a31ea15d60ae',
        undefined,
        'http://localhost:3000',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects images larger than 5MB', async () => {
    await expect(
      service.saveCoverImage(
        '1474ebf6-8e4b-4f40-9b43-a31ea15d60ae',
        {
          originalname: 'cover.png',
          mimetype: 'image/png',
          buffer: Buffer.alloc(0),
          size: 5 * 1024 * 1024 + 1,
        },
        'http://localhost:3000',
      ),
    ).rejects.toThrow('Tournament cover image must be 5MB or smaller');
  });

  it('rejects unsupported image types', async () => {
    await expect(
      service.saveCoverImage(
        '1474ebf6-8e4b-4f40-9b43-a31ea15d60ae',
        {
          originalname: 'cover.gif',
          mimetype: 'image/gif',
          buffer: Buffer.alloc(0),
          size: 1024,
        },
        'http://localhost:3000',
      ),
    ).rejects.toThrow('Tournament cover image type must be JPEG, PNG, or WebP');
  });
});
