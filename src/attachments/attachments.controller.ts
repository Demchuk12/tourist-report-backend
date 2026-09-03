import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AttachmentsService } from './attachments.service.js';
import type { AttachmentResponse } from './attachment.mapper.js';

/**
 * A hard ceiling for multer's in-memory buffer. The configurable limit
 * (MAX_UPLOAD_BYTES) is enforced in the service, where .env is actually loaded —
 * this constant only keeps a request from buffering unbounded bytes first.
 */
const MULTER_HARD_LIMIT_BYTES = 25 * 1024 * 1024;

@ApiTags('attachments')
@ApiBearerAuth()
@Controller()
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get('excursions/:excursionId/receipts')
  @ApiOperation({ summary: 'Receipt metadata for one excursion' })
  findForExcursion(
    @Param('excursionId', ParseUUIDPipe) excursionId: string,
  ): Promise<AttachmentResponse[]> {
    return this.attachments.findForExcursion(excursionId);
  }

  @Post('excursions/:excursionId/receipts')
  @ApiOperation({ summary: 'Upload a receipt photo for an excursion' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MULTER_HARD_LIMIT_BYTES } }),
  )
  upload(
    @Param('excursionId', ParseUUIDPipe) excursionId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AttachmentResponse> {
    return this.attachments.upload(excursionId, file);
  }

  @Get('attachments/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AttachmentResponse> {
    return this.attachments.findOne(id);
  }

  @Get('attachments/:id/content')
  @ApiOperation({ summary: 'Download the stored bytes' })
  @Header('Cache-Control', 'private, max-age=31536000, immutable')
  async content(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { stream, mimeType, name, size } =
      await this.attachments.openContent(id);
    response.setHeader('Content-Length', size);

    return new StreamableFile(stream, {
      type: mimeType,
      disposition: `inline; filename="${encodeURIComponent(name)}"`,
    });
  }

  @Delete('attachments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.attachments.remove(id);
  }
}
