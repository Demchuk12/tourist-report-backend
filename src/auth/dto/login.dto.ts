import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@tourist-report.local' })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({ example: 'admin12345' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password: string;
}
