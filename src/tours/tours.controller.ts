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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
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
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: TourStatus,
  ): Promise<TourResponse[]> {
    return this.tours.findAll(user, status);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TourResponse> {
    return this.tours.findOne(user, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTourDto,
  ): Promise<TourResponse> {
    return this.tours.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTourDto,
  ): Promise<TourResponse> {
    return this.tours.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.tours.remove(user, id);
  }
}
