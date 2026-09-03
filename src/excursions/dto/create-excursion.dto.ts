import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExcursionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CALENDAR_DATE_PATTERN,
  CLOCK_TIME_PATTERN,
} from '../../common/validation.js';

export class CreateExcursionDto {
  @ApiProperty({ example: 'Замок Паланок' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Мукачево' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({
    example: '2026-05-14',
    description: 'YYYY-MM-DD or empty',
  })
  @IsOptional()
  @Matches(CALENDAR_DATE_PATTERN, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @ApiPropertyOptional({ example: '09:30', description: 'HH:mm or empty' })
  @IsOptional()
  @Matches(CLOCK_TIME_PATTERN, { message: 'time must be HH:mm' })
  time?: string;

  @ApiPropertyOptional({ example: 'Ірина Мельник' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  guide?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    enum: ExcursionStatus,
    default: ExcursionStatus.pending,
    description: 'Recorded by hand — never derived from the date',
  })
  @IsOptional()
  @IsEnum(ExcursionStatus)
  status?: ExcursionStatus;

  @ApiPropertyOptional({ example: 250, description: 'Price per participant' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999)
  price?: number;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Tourists who have paid; anyone absent from the list is unpaid',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  paidTouristIds?: string[];
}
