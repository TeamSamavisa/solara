/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import {
  ClassAllocationData,
  ScheduleData,
} from './interfaces/timetable-data.interface';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

// Import interfaces
import {
  TimetableInputData,
  OptimizationResult,
  OptimizedAllocation,
} from './interfaces/timetable-data.interface';

// Import entities
import { Assignment } from '../assignment/entities/assignment.entity';
import { AssignmentSchedule } from '../assignment/entities/assignment-schedule.entity';
import { Space } from '../space/entities/space.entity';
import { SpaceType } from '../space-type/entities/space-type.entity';
import { CourseType } from '../course-type/entities/course-type.entity';
import { Course } from '../course/entities/course.entity';
import { Shift } from '../shift/entities/shift.entity';
import { User } from '../user/entities/user.entity';
import { Subject } from '../subject/entities/subject.entity';
import { Schedule } from '../schedule/entities/schedule.entity';
import { ClassGroup } from '../class-group/entities/class-group.entity';
import { ScheduleTeacher } from '../schedule-teacher/entities/schedule-teacher.entity';

// Import RabbitMQ service
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

// Import Task service
import { TaskService } from '../task/task.service';
import { TaskType, TaskStatus } from '../task/entities/task.entity';

@Injectable()
export class TimetablingService {
  private readonly logger = new Logger(TimetablingService.name);

  constructor(
    @InjectModel(Assignment)
    private readonly assignmentModel: typeof Assignment,
    @InjectModel(AssignmentSchedule)
    private readonly assignmentScheduleModel: typeof AssignmentSchedule,
    @InjectModel(Space)
    private readonly spaceModel: typeof Space,
    @InjectModel(SpaceType)
    private readonly spaceTypeModel: typeof SpaceType,
    @InjectModel(CourseType)
    private readonly courseTypeModel: typeof CourseType,
    @InjectModel(Course)
    private readonly courseModel: typeof Course,
    @InjectModel(Shift)
    private readonly shiftModel: typeof Shift,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Subject)
    private readonly subjectModel: typeof Subject,
    @InjectModel(Schedule)
    private readonly scheduleModel: typeof Schedule,
    @InjectModel(ClassGroup)
    private readonly classGroupModel: typeof ClassGroup,
    @InjectModel(ScheduleTeacher)
    private readonly scheduleTeacherModel: typeof ScheduleTeacher,
    private readonly sequelize: Sequelize,
    private readonly rabbitmqService: RabbitMQService,
    private readonly taskService: TaskService,
  ) {}

  /**
   * Collects all necessary data to send to timetabling-service
   */
  async collectTimetableData(): Promise<TimetableInputData> {
    this.logger.log('Collecting timetable data...');

    // 1. Space Types
    const spaceTypes = await this.spaceTypeModel.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      raw: true,
    });

    // 2. Classrooms (Spaces)
    const classrooms = await this.spaceModel.findAll({
      attributes: [
        'id',
        'name',
        'floor',
        'capacity',
        'blocked',
        'space_type_id',
      ],
      order: [['name', 'ASC']],
      raw: true,
    });

    // 3. Course Types
    const courseTypes = await this.courseTypeModel.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      raw: true,
    });

    // 4. Courses
    const courses = await this.courseModel.findAll({
      attributes: ['id', 'name', 'course_type_id'],
      order: [['name', 'ASC']],
      raw: true,
    });

    // 5. Shifts
    const shifts = await this.shiftModel.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      raw: true,
    });

    // 6. Teachers
    const teachers = await this.userModel.findAll({
      attributes: ['id', 'full_name'],
      where: { role: 'teacher' },
      order: [['full_name', 'ASC']],
      raw: true,
    });

    // 7. Subjects
    const subjects = await this.subjectModel.findAll({
      attributes: ['id', 'name', 'required_space_type_id', 'course_id'],
      order: [['name', 'ASC']],
      raw: true,
    });

    // 8. Schedules
    const schedules = await this.scheduleModel.findAll({
      attributes: ['id', 'weekday', 'start_time', 'end_time', 'shift_id'],
      order: [
        [
          this.sequelize.literal(`CASE weekday
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
          END`),
          'ASC',
        ],
        ['start_time', 'ASC'],
      ],
      raw: true,
    });

    // 9. Class Groups
    const classGroups = await this.classGroupModel.findAll({
      attributes: [
        'id',
        'name',
        'semester',
        'module',
        'student_count',
        'course_id',
        'shift_id',
      ],
      order: [['name', 'ASC']],
      raw: true,
    });

    // 10. Class Allocations (with schedules if they exist)
    const classAllocationsRaw = await this.assignmentModel.findAll({
      attributes: [
        'id',
        'class_group_id',
        'subject_id',
        'teacher_id',
        'space_id',
        'duration',
      ],
      include: [
        {
          model: this.scheduleModel,
          as: 'schedules',
          attributes: ['id', 'weekday', 'start_time', 'end_time', 'shift_id'],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [['id', 'ASC']],
    });

    const classAllocations: ClassAllocationData[] = classAllocationsRaw.map(
      (alloc) => {
        const allocPlain = alloc.get({ plain: true }) as Record<
          string,
          unknown
        >;
        return {
          id: allocPlain.id as number,
          class_group_id: allocPlain.class_group_id as number,
          subject_id: allocPlain.subject_id as number,
          teacher_id: allocPlain.teacher_id as number,
          space_id: allocPlain.space_id as number | null,
          duration: allocPlain.duration as number,
          schedules: (allocPlain.schedules || []) as ScheduleData[],
        };
      },
    );

    // 11. Teacher Schedules (availability)
    const scheduleTeachersRaw = await this.scheduleTeacherModel.findAll({
      attributes: ['teacher_id', 'schedule_id'],
      include: [
        {
          model: this.userModel,
          attributes: [],
          where: { role: 'teacher' },
          required: true,
        },
      ],
      order: [
        ['teacher_id', 'ASC'],
        ['schedule_id', 'ASC'],
      ],
      raw: true,
    });

    const teacherSchedules = scheduleTeachersRaw.reduce(
      (acc, st: { teacher_id: number; schedule_id: number }) => {
        const teacherId = st.teacher_id;
        const scheduleId = st.schedule_id;
        if (!acc[teacherId]) {
          acc[teacherId] = [];
        }
        acc[teacherId].push(scheduleId);
        return acc;
      },
      {} as Record<number, number[]>,
    );

    this.logger.log(
      `Data collected: ${classAllocations.length} allocations, ` +
        `${classrooms.length} classrooms, ${teachers.length} teachers`,
    );

    // Return complete structure
    return {
      space_types: spaceTypes,
      classrooms: classrooms,
      course_types: courseTypes,
      courses: courses,
      shifts: shifts,
      teachers: teachers,
      subjects: subjects,
      schedules: schedules,
      class_groups: classGroups,
      class_allocations: classAllocations,
      teacher_schedules: teacherSchedules,
    };
  }

  /**
   * Validates if collected data is sufficient for optimization
   */
  validateTimetableData(data: TimetableInputData): string[] {
    const errors: string[] = [];

    if (!data.classrooms || data.classrooms.length === 0) {
      errors.push('Nenhuma sala cadastrada no sistema');
    }

    if (!data.teachers || data.teachers.length === 0) {
      errors.push('Nenhum professor cadastrado no sistema');
    }

    if (!data.schedules || data.schedules.length === 0) {
      errors.push('Nenhum horário cadastrado no sistema');
    }

    if (!data.class_allocations || data.class_allocations.length === 0) {
      errors.push('Nenhuma alocação pendente para otimizar');
    }

    if (!data.subjects || data.subjects.length === 0) {
      errors.push('Nenhuma disciplina cadastrada no sistema');
    }

    if (!data.class_groups || data.class_groups.length === 0) {
      errors.push('Nenhuma turma cadastrada no sistema');
    }

    return errors;
  }

  /**
   * Optimizes pending allocation schedules with task tracking
   */
  async optimizeTimetable(): Promise<{
    taskId: number;
    correlationId: string;
  }> {
    this.logger.log('Starting timetable optimization...');

    try {
      // Create task for tracking
      const correlationId = `optimization-${Date.now()}-${uuidv4().substring(0, 8)}`;
      const task = await this.taskService.create({
        correlation_id: correlationId,
        type: TaskType.TIMETABLE_OPTIMIZATION,
        status: TaskStatus.PROCESSING,
      });

      this.logger.log(
        `Task created: ID ${task.id}, Correlation ID: ${correlationId}`,
      );

      // Start optimization in background
      this.processOptimization(task.id).catch((error) => {
        this.logger.error('Background optimization failed:', error);
      });

      // Return task ID immediately
      return {
        taskId: task.id,
        correlationId,
      };
    } catch (error) {
      this.logger.error('Error creating optimization task:', error);
      throw error;
    }
  }

  /**
   * Clears schedule_id and space_id fields from all allocations
   */
  async clearAllAllocations(): Promise<void> {
    this.logger.log(
      'Clearing schedule_id and space_id from all allocations...',
    );

    try {
      const result = await this.assignmentModel.update(
        {
          schedule_id: null,
          space_id: null,
        },
        {
          where: {},
        },
      );

      this.logger.log(`Cleared ${result[0]} allocations`);
    } catch (error) {
      this.logger.error('Error clearing allocations:', error);
      throw error;
    }
  }

  /**
   * Processes optimization in background
   */
  private async processOptimization(taskId: number): Promise<void> {
    try {
      // Update progress: Clearing old allocations
      await this.taskService.updateProgress(taskId, 5);

      // Clear all allocations before optimizing
      await this.clearAllAllocations();

      // Update progress: Collecting data
      await this.taskService.updateProgress(taskId, 10);

      // Collect data
      const timetableData = await this.collectTimetableData();

      // Validate data
      const validationErrors = this.validateTimetableData(timetableData);
      if (validationErrors.length > 0) {
        await this.taskService.markAsFailed(
          taskId,
          `Dados insuficientes: ${validationErrors.join(', ')}`,
        );
        return;
      }

      // Update progress: Sending for optimization
      await this.taskService.updateProgress(taskId, 30);

      // Send to RabbitMQ
      this.logger.log('Sending data to timetabling-service via RabbitMQ...');
      const result = (await this.rabbitmqService.sendMessage(
        'optimize_timetable',
        timetableData,
      )) as OptimizationResult;

      // Update progress: Processing result
      await this.taskService.updateProgress(taskId, 70);

      if (result.status === 'success' && result.data?.schedule) {
        // Update allocations
        await this.updateOptimizedAllocations(result.data.schedule);

        // Mark task as completed
        await this.taskService.markAsCompleted(taskId);

        this.logger.log(`Task ${taskId} completed successfully`);
      } else {
        // Mark task as failed
        await this.taskService.markAsFailed(
          taskId,
          result.message || 'Optimization failed',
        );
      }
    } catch (error) {
      this.logger.error('Error during optimization:', error);
      await this.taskService.markAsFailed(
        taskId,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Updates allocations with optimized schedules and classrooms
   */
  async updateOptimizedAllocations(
    optimizedSchedule: OptimizedAllocation[],
  ): Promise<void> {
    this.logger.log(
      `Updating ${optimizedSchedule.length} optimized allocations...`,
    );

    const transaction = await this.sequelize.transaction();

    try {
      for (const item of optimizedSchedule) {
        // Update space/classroom
        if (item.classroom && item.classroom.id) {
          await this.assignmentModel.update(
            {
              space_id: item.classroom.id,
            },
            {
              where: { id: item.allocation_id },
              transaction,
            },
          );
        }

        // Handle schedules - use schedule_ids directly from optimizer
        const scheduleIds: number[] = item.schedule_ids || [];

        if (scheduleIds.length > 0) {
          // Remove existing schedule relations
          await this.assignmentScheduleModel.destroy({
            where: { assignment_id: item.allocation_id },
            transaction,
          });

          // Create new schedule relations
          const assignmentSchedules = scheduleIds.map((scheduleId) => ({
            assignment_id: item.allocation_id,
            schedule_id: scheduleId,
          }));
          await this.assignmentScheduleModel.bulkCreate(assignmentSchedules, {
            transaction,
          });
        }
      }

      await transaction.commit();
      this.logger.log('Allocations updated successfully');
    } catch (error) {
      await transaction.rollback();
      this.logger.error('Error updating allocations:', error);
      throw error;
    }
  }

  /**
   * Tests connection with timetabling-service
   */
  async testConnection(): Promise<{ status: string; message: string }> {
    this.logger.log('Testing connection to timetabling-service...');

    try {
      const result = (await this.rabbitmqService.sendMessage(
        'test_connection',
        {},
      )) as { status: string; message: string };
      this.logger.log('Connection test successful');
      return result;
    } catch (error) {
      this.logger.error('Connection test failed:', error);
      throw error;
    }
  }

  /**
   * Returns statistics about allocations
   */
  async getStatistics(): Promise<{
    total: number;
    optimized: number;
    pending: number;
    optimizationRate: number;
  }> {
    const total = await this.assignmentModel.count();
    const optimized = await this.assignmentModel.count({
      where: {
        schedule_id: { [Op.not]: null },
        space_id: { [Op.not]: null },
      },
    });
    const pending = total - optimized;

    return {
      total,
      optimized,
      pending,
      optimizationRate: total > 0 ? (optimized / total) * 100 : 0,
    };
  }
}
