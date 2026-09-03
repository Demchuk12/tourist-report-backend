import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ExcursionStatus } from '@prisma/client';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateExcursionDto } from './dto/create-excursion.dto.js';
import { UpdateExcursionDto } from './dto/update-excursion.dto.js';
import {
  ExcursionsService,
  type ExcursionParticipant,
  type ExcursionResponse,
} from './excursions.service.js';

@ApiTags('excursions')
@Controller('excursions')
export class ExcursionsController {
  constructor(private readonly excursions: ExcursionsService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: ExcursionStatus })
  findAll(
    @Query('status') status?: ExcursionStatus,
  ): Promise<ExcursionResponse[]> {
    return this.excursions.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ExcursionResponse> {
    return this.excursions.findOne(id);
  }

  @Get(':id/participants')
  @ApiOperation({
    summary: 'Participants derived from the tours that include this excursion',
  })
  findParticipants(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExcursionParticipant[]> {
    return this.excursions.findParticipants(id);
  }

  @Post()
  create(@Body() dto: CreateExcursionDto): Promise<ExcursionResponse> {
    return this.excursions.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExcursionDto,
  ): Promise<ExcursionResponse> {
    return this.excursions.update(id, dto);
  }

  @Put(':id/payments/:touristId')
  @ApiOperation({ summary: 'Mark a tourist as having paid for this excursion' })
  markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('touristId', ParseUUIDPipe) touristId: string,
  ): Promise<ExcursionResponse> {
    return this.excursions.markPaid(id, touristId);
  }

  @Delete(':id/payments/:touristId')
  @ApiOperation({ summary: 'Mark a tourist as unpaid again' })
  markUnpaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('touristId', ParseUUIDPipe) touristId: string,
  ): Promise<ExcursionResponse> {
    return this.excursions.markUnpaid(id, touristId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.excursions.remove(id);
  }
}
