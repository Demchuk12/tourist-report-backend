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
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateTouristDto } from './dto/create-tourist.dto.js';
import { UpdateTouristDto } from './dto/update-tourist.dto.js';
import { TouristsService, type TouristResponse } from './tourists.service.js';

@ApiTags('tourists')
@Controller('tourists')
export class TouristsController {
  constructor(private readonly tourists: TouristsService) {}

  @Get()
  @ApiOperation({ summary: 'List tourists, newest first' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string): Promise<TouristResponse[]> {
    return this.tourists.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TouristResponse> {
    return this.tourists.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTouristDto): Promise<TouristResponse> {
    return this.tourists.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTouristDto,
  ): Promise<TouristResponse> {
    return this.tourists.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tourists.remove(id);
  }
}
