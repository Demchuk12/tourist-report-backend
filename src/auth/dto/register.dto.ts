import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'olena@tourist-report.local' })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({ example: 'leader12345', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password: string;

  @ApiPropertyOptional({ example: 'Олена Ковальчук' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.leader })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
