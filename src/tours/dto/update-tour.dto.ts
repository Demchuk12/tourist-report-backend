import { PartialType } from '@nestjs/swagger';
import { CreateTourDto } from './create-tour.dto.js';

export class UpdateTourDto extends PartialType(CreateTourDto) {}
