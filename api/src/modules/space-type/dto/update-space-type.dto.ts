import { PartialType } from '@nestjs/swagger';
import { CreateSpaceTypeDto } from './create-space-type.dto';

export class UpdateSpaceTypeDto extends PartialType(CreateSpaceTypeDto) {}
