import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSchedule } from './entities/assignment-schedule.entity';
import { GetAssignmentsQueryDto } from './dto/get-assignments.dto';
import { buildWhere } from 'src/utils/build-where';
import { PaginatedResponse } from 'src/utils/types/paginated-response';
import { User } from '../user/entities/user.entity';
import { Subject } from '../subject/entities/subject.entity';
import { Schedule } from '../schedule/entities/schedule.entity';
import { Space } from '../space/entities/space.entity';
import { ClassGroup } from '../class-group/entities/class-group.entity';
import { Course } from '../course/entities/course.entity';
import { Shift } from '../shift/entities/shift.entity';

interface AvailabilityQueryResult {
  available_count: number | string;
}

interface ScheduleData {
  id: number;
  weekday: string;
  start_time: string;
  end_time: string;
  shift_id: number;
}

interface PlainAssignment {
  id: number;
  teacher_id: number;
  subject_id: number;
  space_id: number | null;
  class_group_id: number;
  duration: number;
  schedules?: ScheduleData[];
  classGroup?: {
    shift_id: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

@Injectable()
export class AssignmentService {
  constructor(
    @InjectModel(Assignment)
    private readonly assignmentModel: typeof Assignment,
    @InjectModel(AssignmentSchedule)
    private readonly assignmentScheduleModel: typeof AssignmentSchedule,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto): Promise<Assignment> {
    const assignmentData = {
      teacher_id: createAssignmentDto.teacher_id,
      subject_id: createAssignmentDto.subject_id,
      space_id: createAssignmentDto.space_id ?? null,
      class_group_id: createAssignmentDto.class_group_id,
      duration: createAssignmentDto.duration ?? 2,
    };

    const assignment = await this.assignmentModel.create(assignmentData);

    // Create relations with schedules if provided
    if (
      createAssignmentDto.schedule_ids &&
      createAssignmentDto.schedule_ids.length > 0
    ) {
      const assignmentSchedules = createAssignmentDto.schedule_ids.map(
        (schedule_id) => ({
          assignment_id: assignment.id,
          schedule_id: schedule_id,
        }),
      );
      await this.assignmentScheduleModel.bulkCreate(assignmentSchedules);
    }

    return this.getById(assignment.id);
  }

  async list(
    query: GetAssignmentsQueryDto,
  ): Promise<PaginatedResponse<Assignment>> {
    const { limit, offset, page, ...filter } = query;

    const whereClause = buildWhere(filter);

    const { rows, count } = await this.assignmentModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'full_name', 'email'],
        },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        {
          model: Schedule,
          as: 'schedules',
          attributes: ['id', 'weekday', 'start_time', 'end_time', 'shift_id'],
          through: { attributes: [] },
        },
        { model: Space, as: 'space', attributes: ['id', 'name', 'capacity'] },
        {
          model: ClassGroup,
          as: 'classGroup',
          attributes: ['id', 'name', 'shift_id'],
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'name'],
            },
            {
              model: Shift,
              as: 'shift',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      distinct: true,
    });

    // Calculate violations for each assignment
    const rowsWithViolations = await Promise.all(
      rows.map(async (assignment) => {
        const plainAssignment = assignment.get({
          plain: true,
        }) as PlainAssignment;

        let violatesAvailability = false;

        // Check only if assignment has schedules and a teacher
        if (
          plainAssignment.schedules &&
          plainAssignment.schedules.length > 0 &&
          plainAssignment.teacher_id
        ) {
          const classGroupShiftId = plainAssignment.classGroup?.shift_id;

          // Check 1: Shift incompatibility
          const hasShiftViolation = plainAssignment.schedules.some(
            (schedule) => schedule.shift_id !== classGroupShiftId,
          );

          if (hasShiftViolation) {
            violatesAvailability = true;
          } else {
            // Check 2: Teacher availability
            const scheduleIds = plainAssignment.schedules.map((s) => s.id);

            const results =
              await this.assignmentModel.sequelize!.query<AvailabilityQueryResult>(
                `
              SELECT COUNT(DISTINCT st.schedule_id) as available_count
              FROM schedule_teachers st
              WHERE st.teacher_id = :teacherId 
              AND st.schedule_id IN (:scheduleIds)
              `,
                {
                  replacements: {
                    teacherId: plainAssignment.teacher_id,
                    scheduleIds: scheduleIds,
                  },
                  type: QueryTypes.SELECT,
                },
              );

            const rawCount = results[0]?.available_count;
            const availableCount =
              typeof rawCount === 'number'
                ? rawCount
                : parseInt(String(rawCount || '0'), 10);

            // Teacher must be available in ALL schedules
            violatesAvailability = availableCount !== scheduleIds.length;
          }
        }

        return {
          ...plainAssignment,
          violates_availability: violatesAvailability,
        };
      }),
    );

    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      content: rowsWithViolations as unknown as Assignment[],
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  private async checkAvailabilityViolation(
    teacherId: number,
    assignmentId: number,
  ): Promise<boolean> {
    const assignment = await this.assignmentModel.findByPk(assignmentId, {
      include: [
        {
          model: Schedule,
          as: 'schedules',
          attributes: ['id', 'shift_id'],
          through: { attributes: [] },
        },
        {
          model: ClassGroup,
          as: 'classGroup',
          attributes: ['id', 'shift_id'],
        },
      ],
    });

    if (
      !assignment ||
      !assignment.schedules ||
      assignment.schedules.length === 0 ||
      !teacherId
    ) {
      return false;
    }

    const classGroupShiftId = assignment.classGroup?.shift_id;

    // Check 1: Shift incompatibility
    const hasShiftViolation = assignment.schedules.some(
      (schedule) => schedule.shift_id !== classGroupShiftId,
    );

    if (hasShiftViolation) {
      return true;
    }

    // Check 2: Teacher availability
    const scheduleIds = assignment.schedules.map((s) => s.id);

    const results =
      await this.assignmentModel.sequelize!.query<AvailabilityQueryResult>(
        `
      SELECT COUNT(DISTINCT st.schedule_id) as available_count
      FROM schedule_teachers st
      WHERE st.teacher_id = :teacherId 
      AND st.schedule_id IN (:scheduleIds)
      `,
        {
          replacements: {
            teacherId: teacherId,
            scheduleIds: scheduleIds,
          },
          type: QueryTypes.SELECT,
        },
      );

    const rawCount = results[0]?.available_count;
    const availableCount =
      typeof rawCount === 'number'
        ? rawCount
        : parseInt(String(rawCount || '0'), 10);

    // Teacher must be available in ALL schedules
    return availableCount !== scheduleIds.length;
  }

  async getById(id: number) {
    const assignment = await this.assignmentModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'full_name', 'email'],
        },
        { model: Subject, as: 'subject', attributes: ['id', 'name'] },
        {
          model: Schedule,
          as: 'schedules',
          attributes: ['id', 'weekday', 'start_time', 'end_time', 'shift_id'],
          through: { attributes: [] },
        },
        { model: Space, as: 'space', attributes: ['id', 'name', 'capacity'] },
        {
          model: ClassGroup,
          as: 'classGroup',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const violatesAvailability = await this.checkAvailabilityViolation(
      assignment.teacher_id,
      assignment.id,
    );

    return {
      ...assignment.get({ plain: true }),
      violates_availability: violatesAvailability,
    } as Assignment;
  }

  async update(
    id: number,
    updateAssignmentDto: UpdateAssignmentDto,
  ): Promise<Assignment> {
    const assignment = await this.ensureRecordExists(id);

    const updateData: Partial<Assignment> = {};

    if (updateAssignmentDto.teacher_id !== undefined) {
      updateData.teacher_id = updateAssignmentDto.teacher_id;
    }

    if (updateAssignmentDto.subject_id !== undefined) {
      updateData.subject_id = updateAssignmentDto.subject_id;
    }

    if (updateAssignmentDto.space_id !== undefined) {
      updateData.space_id = updateAssignmentDto.space_id;
    }

    if (updateAssignmentDto.class_group_id !== undefined) {
      updateData.class_group_id = updateAssignmentDto.class_group_id;
    }

    if (updateAssignmentDto.duration !== undefined) {
      updateData.duration = updateAssignmentDto.duration;
    }

    await assignment.update(updateData);

    // Update schedules if provided
    if (updateAssignmentDto.schedule_ids !== undefined) {
      // Remove existing relations
      await this.assignmentScheduleModel.destroy({
        where: { assignment_id: id },
      });

      // Create new relations
      if (updateAssignmentDto.schedule_ids.length > 0) {
        const assignmentSchedules = updateAssignmentDto.schedule_ids.map(
          (schedule_id) => ({
            assignment_id: id,
            schedule_id: schedule_id,
          }),
        );
        await this.assignmentScheduleModel.bulkCreate(assignmentSchedules);
      }
    }

    return this.getById(id);
  }

  async remove(id: number) {
    const assignment = await this.ensureRecordExists(id);
    await assignment.destroy();
    return assignment;
  }

  private async ensureRecordExists(id: number): Promise<Assignment> {
    const assignment = await this.assignmentModel.findByPk(id);

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }
}
