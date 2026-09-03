import { PartialType } from '@nestjs/swagger';
import { CreateExcursionDto } from './create-excursion.dto.js';

export class UpdateExcursionDto extends PartialType(CreateExcursionDto) {}
