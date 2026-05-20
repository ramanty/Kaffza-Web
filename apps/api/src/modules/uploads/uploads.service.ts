import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    const region = process.env.S3_REGION || 'us-east-1';
    this.bucket = process.env.S3_BUCKET || 'kaffza-images';

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  /**
   * C-04: Validate magic bytes (file signature) to prevent malicious files
   * from being uploaded as images.
   */
  private validateMagicBytes(buffer: Buffer): boolean {
    if (buffer.length < 12) return false;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return true;
    }

    // WebP: RIFF ... WEBP
    if (
      buffer[0] === 0x52 && // R
      buffer[1] === 0x49 && // I
      buffer[2] === 0x46 && // F
      buffer[3] === 0x46 && // F
      buffer[8] === 0x57 && // W
      buffer[9] === 0x45 && // E
      buffer[10] === 0x42 && // B
      buffer[11] === 0x50 // P
    ) {
      return true;
    }

    return false;
  }

  async uploadImage(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('الملف مطلوب');

    // C-04: Validate magic bytes to ensure it's a real image
    if (!this.validateMagicBytes(file.buffer)) {
      throw new BadRequestException('محتوى الملف غير صالح أو نوع الصورة غير مدعوم');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('نوع الملف المرفق غير مدعوم');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('حجم الملف يتجاوز الحد المسموح (5MB)');
    }

    const ext = file.originalname.split('.').pop() || 'bin';
    const key = `images/${Date.now()}-${randomUUID()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const publicBase = (process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || '').replace(
      /\/$/,
      ''
    );
    const url = publicBase ? `${publicBase}/${this.bucket}/${key}` : `/${this.bucket}/${key}`;

    return { url };
  }
}
