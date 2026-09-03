import type { Attachment } from '@prisma/client';

export type AttachmentResponse = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  /** Where the bytes can be fetched; the metadata never carries the payload. */
  url: string;
};

export function toAttachmentResponse(
  attachment: Attachment,
): AttachmentResponse {
  return {
    id: attachment.id,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    createdAt: attachment.createdAt.toISOString(),
    url: `/api/attachments/${attachment.id}/content`,
  };
}
