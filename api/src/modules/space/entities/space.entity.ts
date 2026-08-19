import { ApiProperty } from '@nestjs/swagger';
import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Assignment } from 'src/modules/assignment/entities/assignment.entity';
import { SpaceType } from 'src/modules/space-type/entities/space-type.entity';

@Table({ tableName: 'spaces' })
export class Space extends Model {
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

  @ApiProperty()
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  floor: number;

  @ApiProperty()
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  capacity: number;

  @ApiProperty()
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  blocked: boolean;

  @ApiProperty()
  @ForeignKey(() => SpaceType)
  @Column(DataType.INTEGER)
  space_type_id: number;

  @ApiProperty({ type: () => SpaceType })
  @BelongsTo(() => SpaceType)
  spaceType: SpaceType;

  @HasMany(() => Assignment)
  assignments: Assignment[];
}
