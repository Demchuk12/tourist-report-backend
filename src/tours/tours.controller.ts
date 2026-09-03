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
  Query,
} from '@nestjs/common';
import { TourStatus } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateTourDto } from './dto/create-tour.dto.js';
import { UpdateTourDto } from './dto/update-tour.dto.js';
import { ToursService, type TourResponse } from './tours.service.js';

@ApiTags('tours')
@ApiBearerAuth()
@Controller('tours')
export class ToursController {
  constructor(private readonly tours: ToursService) {}

  @Get()
  @ApiOperation({ summary: 'List tours, newest first' })
  @ApiQuery({ name: 'status', required: false, enum: TourStatus })
  findAll(@Query('status') status?: TourStatus): Promise<TourResponse[]> {
    return this.tours.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TourResponse> {
    return this.tours.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTourDto): Promise<TourResponse> {
    return this.tours.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTourDto,
  ): Promise<TourResponse> {
    return this.tours.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tours.remove(id);
  }
}
