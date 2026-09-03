import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type ExcursionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  toAttachmentResponse,
  type AttachmentResponse,
} from '../attachments/attachment.mapper.js';
import type { CreateExcursionDto } from './dto/create-excursion.dto.js';
import type { UpdateExcursionDto } from './dto/update-excursion.dto.js';

const excursionInclude = {
  paidBy: { select: { id: true } },
  receipts: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ExcursionInclude;

type ExcursionRow = Prisma.ExcursionGetPayload<{
  include: typeof excursionInclude;
}>;

export type ExcursionResponse = {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  guide: string;
  notes: string;
  status: ExcursionStatus;
  price: number;
  paidTouristIds: string[];
  receipts: AttachmentResponse[];
  createdAt: string;
  updatedAt: string;
};

/** A participant derived from the tours this excursion belongs to. */
export type ExcursionParticipant = {
  touristId: string;
  fullName: string;
  /** Every tour that booked this tourist onto the excursion. */
  tours: { id: string; name: string }[];
  paid: boolean;
};

@Injectable()
export class ExcursionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: ExcursionStatus): Promise<ExcursionResponse[]> {
    const excursions = await this.prisma.excursion.findMany({
      where: status ? { status } : undefined,
      include: excursionInclude,
      orderBy: { createdAt: 'desc' },
    });

    return excursions.map(toExcursionResponse);
  }

  async findOne(id: string): Promise<ExcursionResponse> {
    return toExcursionResponse(await this.getRow(id));
  }

  async create(dto: CreateExcursionDto): Promise<ExcursionResponse> {
    const { paidTouristIds, ...fields } = dto;

    const excursion = await this.prisma.excursion.create({
      data: {
        ...fields,
        paidBy: paidTouristIds?.length
          ? { connect: paidTouristIds.map((id) => ({ id })) }
          : undefined,
      },
      include: excursionInclude,
    });

    return toExcursionResponse(excursion);
  }

  async update(
    id: string,
    dto: UpdateExcursionDto,
  ): Promise<ExcursionResponse> {
    const { paidTouristIds, ...fields } = dto;

    const excursion = await this.prisma.excursion.update({
      where: { id },
      data: {
        ...fields,
        paidBy: paidTouristIds
          ? { set: paidTouristIds.map((id) => ({ id })) }
          : undefined,
      },
      include: excursionInclude,
    });

    return toExcursionResponse(excursion);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.excursion.delete({ where: { id } });
  }

  /** Marks one tourist as having paid. Idempotent — connecting twice is a no-op. */
  async markPaid(id: string, touristId: string): Promise<ExcursionResponse> {
    const excursion = await this.prisma.excursion.update({
      where: { id },
      data: { paidBy: { connect: { id: touristId } } },
      include: excursionInclude,
    });

    return toExcursionResponse(excursion);
  }

  async markUnpaid(id: string, touristId: string): Promise<ExcursionResponse> {
    const excursion = await this.prisma.excursion.update({
      where: { id },
      data: { paidBy: { disconnect: { id: touristId } } },
      include: excursionInclude,
    });

    return toExcursionResponse(excursion);
  }

  /**
   * Participation is derived, never stored: whoever is on a tour that includes
   * this excursion takes part in it. A tourist booked through two tours appears
   * once, carrying both tour names.
   */
  async findParticipants(id: string): Promise<ExcursionParticipant[]> {
    const excursion = await this.prisma.excursion.findUnique({
      where: { id },
      include: {
        paidBy: { select: { id: true } },
        tours: {
          select: {
            id: true,
            name: true,
            tourists: { select: { id: true, fullName: true } },
          },
        },
      },
    });
    if (!excursion) throw new NotFoundException(`Excursion ${id} not found`);

    const paid = new Set(excursion.paidBy.map((tourist) => tourist.id));
    const participants = new Map<string, ExcursionParticipant>();

    for (const tour of excursion.tours) {
      for (const tourist of tour.tourists) {
        const existing = participants.get(tourist.id);
        if (existing) {
          existing.tours.push({ id: tour.id, name: tour.name });
          continue;
        }

        participants.set(tourist.id, {
          touristId: tourist.id,
          fullName: tourist.fullName,
          tours: [{ id: tour.id, name: tour.name }],
          paid: paid.has(tourist.id),
        });
      }
    }

    return [...participants.values()].sort((left, right) =>
      left.fullName.localeCompare(right.fullName, 'uk'),
    );
  }

  private async getRow(id: string): Promise<ExcursionRow> {
    const excursion = await this.prisma.excursion.findUnique({
      where: { id },
      include: excursionInclude,
    });
    if (!excursion) throw new NotFoundException(`Excursion ${id} not found`);

    return excursion;
  }
}

export function toExcursionResponse(
  excursion: ExcursionRow,
): ExcursionResponse {
  return {
    id: excursion.id,
    title: excursion.title,
    location: excursion.location,
    date: excursion.date,
    time: excursion.time,
    guide: excursion.guide,
    notes: excursion.notes,
    status: excursion.status,
    // Decimal keeps the money exact in the database; the wire format is a plain
    // number so the client can format it the way it already does.
    price: excursion.price.toNumber(),
    paidTouristIds: excursion.paidBy.map((tourist) => tourist.id),
    receipts: excursion.receipts.map(toAttachmentResponse),
    createdAt: excursion.createdAt.toISOString(),
    updatedAt: excursion.updatedAt.toISOString(),
  };
}
