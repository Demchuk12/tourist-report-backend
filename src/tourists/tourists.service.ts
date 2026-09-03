import { Injectable, NotFoundException } from '@nestjs/common';
import type { Tourist } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTouristDto } from './dto/create-tourist.dto.js';
import type { UpdateTouristDto } from './dto/update-tourist.dto.js';

export type TouristResponse = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  documentNumber: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class TouristsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string): Promise<TouristResponse[]> {
    const tourists = await this.prisma.tourist.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { documentNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return tourists.map(toTouristResponse);
  }

  async findOne(id: string): Promise<TouristResponse> {
    const tourist = await this.prisma.tourist.findUnique({ where: { id } });
    if (!tourist) throw new NotFoundException(`Tourist ${id} not found`);

    return toTouristResponse(tourist);
  }

  async create(dto: CreateTouristDto): Promise<TouristResponse> {
    const tourist = await this.prisma.tourist.create({ data: { ...dto } });

    return toTouristResponse(tourist);
  }

  async update(id: string, dto: UpdateTouristDto): Promise<TouristResponse> {
    const tourist = await this.prisma.tourist.update({
      where: { id },
      data: { ...dto },
    });

    return toTouristResponse(tourist);
  }

  /**
   * Prisma drops the implicit many-to-many rows (tour membership and excursion
   * payments) on delete, which is the cascade the client store performs by hand.
   */
  async remove(id: string): Promise<void> {
    await this.prisma.tourist.delete({ where: { id } });
  }
}

function toTouristResponse(tourist: Tourist): TouristResponse {
  return {
    id: tourist.id,
    fullName: tourist.fullName,
    phone: tourist.phone,
    email: tourist.email,
    documentNumber: tourist.documentNumber,
    notes: tourist.notes,
    createdAt: tourist.createdAt.toISOString(),
    updatedAt: tourist.updatedAt.toISOString(),
  };
}
