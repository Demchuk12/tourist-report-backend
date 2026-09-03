import { createReadStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ReadStream } from 'node:fs';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  toAttachmentResponse,
  type AttachmentResponse,
} from './attachment.mapper.js';

const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];

const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Receipt photos follow the same rule as in the PWA: the document holds metadata
 * only and the bytes live outside it — here, one file per attachment under
 * UPLOAD_DIR, named by the attachment id.
 */
@Injectable()
export class AttachmentsService implements OnModuleInit {
  private readonly uploadDir: string;
  private readonly maxBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const configured = config.get<string>('UPLOAD_DIR') ?? 'uploads';
    this.uploadDir = isAbsolute(configured)
      ? configured
      : resolve(process.cwd(), configured);
    this.maxBytes = Number(
      config.get('MAX_UPLOAD_BYTES') ?? DEFAULT_MAX_UPLOAD_BYTES,
    );
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.uploadDir, { recursive: true });
  }

  async findForExcursion(excursionId: string): Promise<AttachmentResponse[]> {
    const excursion = await this.prisma.excursion.findUnique({
      where: { id: excursionId },
      select: { id: true },
    });
    if (!excursion)
      throw new NotFoundException(`Excursion ${excursionId} not found`);

    const attachments = await this.prisma.attachment.findMany({
      where: { excursionId },
      orderBy: { createdAt: 'asc' },
    });

    return attachments.map(toAttachmentResponse);
  }

  async upload(
    excursionId: string,
    file: Express.Multer.File,
  ): Promise<AttachmentResponse> {
    if (!file)
      throw new BadRequestException('No file uploaded under the "file" field');
    if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        `Unsupported file type ${file.mimetype}`,
      );
    }
    if (file.size > this.maxBytes) {
      throw new PayloadTooLargeException(`File exceeds ${this.maxBytes} bytes`);
    }

    // The row is written first so the file is only ever orphaned, never dangling:
    // a missing row would leave bytes nobody can reach or delete.
    const attachment = await this.prisma.attachment.create({
      data: {
        excursionId,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    try {
      await writeFile(this.pathFor(attachment.id), file.buffer);
    } catch (error) {
      await this.prisma.attachment.delete({ where: { id: attachment.id } });
      throw error;
    }

    return toAttachmentResponse(attachment);
  }

  async findOne(id: string): Promise<AttachmentResponse> {
    return toAttachmentResponse(await this.getRow(id));
  }

  async openContent(id: string): Promise<{
    stream: ReadStream;
    mimeType: string;
    name: string;
    size: number;
  }> {
    const attachment = await this.getRow(id);

    return {
      stream: createReadStream(this.pathFor(attachment.id)),
      mimeType: attachment.mimeType,
      name: attachment.name,
      size: attachment.size,
    };
  }

  async remove(id: string): Promise<void> {
    await this.prisma.attachment.delete({ where: { id } });
    // force: an already-missing file is the state we wanted anyway.
    await rm(this.pathFor(id), { force: true });
  }

  private async getRow(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });
    if (!attachment) throw new NotFoundException(`Attachment ${id} not found`);

    return attachment;
  }

  private pathFor(id: string): string {
    return join(this.uploadDir, id);
  }
}
