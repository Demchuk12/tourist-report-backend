import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type TourStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTourDto } from './dto/create-tour.dto.js';
import type { UpdateTourDto } from './dto/update-tour.dto.js';

/**
 * Relations travel over the wire as plain id arrays, the same shape the PWA
 * store keeps, so only the ids are selected here.
 */
const tourInclude = {
  tourists: { select: { id: true } },
  excursions: { select: { id: true } },
} satisfies Prisma.TourInclude;

type TourRow = Prisma.TourGetPayload<{ include: typeof tourInclude }>;

export type TourResponse = {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TourStatus;
  touristIds: string[];
  excursionIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class ToursService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: TourStatus): Promise<TourResponse[]> {
    const tours = await this.prisma.tour.findMany({
      where: status ? { status } : undefined,
      include: tourInclude,
      orderBy: { createdAt: 'desc' },
    });

    return tours.map(toTourResponse);
  }

  async findOne(id: string): Promise<TourResponse> {
    const tour = await this.prisma.tour.findUnique({
      where: { id },
      include: tourInclude,
    });
    if (!tour) throw new NotFoundException(`Tour ${id} not found`);

    return toTourResponse(tour);
  }

  async create(dto: CreateTourDto): Promise<TourResponse> {
    const { touristIds, excursionIds, ...fields } = dto;

    const tour = await this.prisma.tour.create({
      data: {
        ...fields,
        tourists: connect(touristIds),
        excursions: connect(excursionIds),
      },
      include: tourInclude,
    });

    return toTourResponse(tour);
  }

  /**
   * Relation arrays are `set` rather than merged: the client sends the full
   * membership it wants, so a removed tourist disappears without a second call.
   */
  async update(id: string, dto: UpdateTourDto): Promise<TourResponse> {
    const { touristIds, excursionIds, ...fields } = dto;

    const tour = await this.prisma.tour.update({
      where: { id },
      data: {
        ...fields,
        tourists: replace(touristIds),
        excursions: replace(excursionIds),
      },
      include: tourInclude,
    });

    return toTourResponse(tour);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.tour.delete({ where: { id } });
  }
}

type IdRef = { id: string };

function connect(ids?: string[]): { connect: IdRef[] } | undefined {
  return ids?.length ? { connect: ids.map((id) => ({ id })) } : undefined;
}

/** `set` rather than `connect`: the client sends the membership it wants in full. */
function replace(ids?: string[]): { set: IdRef[] } | undefined {
  return ids ? { set: ids.map((id) => ({ id })) } : undefined;
}

function toTourResponse(tour: TourRow): TourResponse {
  return {
    id: tour.id,
    name: tour.name,
    destination: tour.destination,
    startDate: tour.startDate,
    endDate: tour.endDate,
    status: tour.status,
    touristIds: tour.tourists.map((tourist) => tourist.id),
    excursionIds: tour.excursions.map((excursion) => excursion.id),
    notes: tour.notes,
    createdAt: tour.createdAt.toISOString(),
    updatedAt: tour.updatedAt.toISOString(),
  };
}
