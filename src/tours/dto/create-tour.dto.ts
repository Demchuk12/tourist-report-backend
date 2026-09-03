import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TourStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { CALENDAR_DATE_PATTERN } from '../../common/validation.js';

export class CreateTourDto {
  @ApiProperty({ example: 'Карпати, травень' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Яремче' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  destination?: string;

  @ApiPropertyOptional({
    example: '2026-05-12',
    description: 'YYYY-MM-DD or empty',
  })
  @IsOptional()
  @Matches(CALENDAR_DATE_PATTERN, { message: 'startDate must be YYYY-MM-DD' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-05-19',
    description: 'YYYY-MM-DD or empty',
  })
  @IsOptional()
  @Matches(CALENDAR_DATE_PATTERN, { message: 'endDate must be YYYY-MM-DD' })
  endDate?: string;

  @ApiPropertyOptional({ enum: TourStatus, default: TourStatus.planned })
  @IsOptional()
  @IsEnum(TourStatus)
  status?: TourStatus;

  @ApiPropertyOptional({
    type: [String],
    description: 'Replaces the tour membership wholesale',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  touristIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excursionIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
