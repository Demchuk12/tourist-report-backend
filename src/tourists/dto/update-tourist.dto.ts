import { PartialType } from '@nestjs/swagger';
import { CreateTouristDto } from './create-tourist.dto.js';

export class UpdateTouristDto extends PartialType(CreateTouristDto) {}
