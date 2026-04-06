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

  async uploadImage(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('الملف مطلوب');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new BadRequestException('نوع الملف غير مدعوم');
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

    const endpoint = (process.env.S3_ENDPOINT || '').replace(/\/$/, '');
    const url = endpoint ? `${endpoint}/${this.bucket}/${key}` : `/${this.bucket}/${key}`;

    return { url };
  }
}
