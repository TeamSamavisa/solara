import { ApiProperty } from '@nestjs/swagger';
import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { ClassGroup } from 'src/modules/class-group/entities/class-group.entity';

@Table({ tableName: 'shifts' })
export class Shift extends Model {
  @ApiProperty()
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ApiProperty()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @HasMany(() => ClassGroup)
  classGroups: ClassGroup[];
}
