import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Task, TaskStatus, TaskType } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectModel(Task)
    private readonly taskModel: typeof Task,
  ) {}

  /**
   * Cria uma nova tarefa
   */
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    this.logger.log(`Creating task: ${createTaskDto.correlation_id}`);

    const task = await this.taskModel.create({
      correlation_id: createTaskDto.correlation_id,
      type: createTaskDto.type,
      status: createTaskDto.status || TaskStatus.PROCESSING,
      progress: 0,
    });

    return task;
  }

  /**
   * Busca uma tarefa por ID
   */
  async findOne(id: number): Promise<Task> {
    const task = await this.taskModel.findByPk(id);

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  /**
   * Busca uma tarefa por correlation_id
   */
  async findByCorrelationId(correlationId: string): Promise<Task | null> {
    return this.taskModel.findOne({
      where: { correlation_id: correlationId },
    });
  }

  /**
   * Busca a última tarefa criada
   */
  async getLastTask(): Promise<Task | null> {
    return this.taskModel.findOne({
      raw: true,
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Busca a última tarefa de um tipo específico
   */
  async getLastTaskByType(type: TaskType): Promise<Task | null> {
    return this.taskModel.findOne({
      where: { type },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Retorna o status de uma tarefa
   */
  async getTaskStatus(id: number): Promise<Task> {
    return this.findOne(id);
  }

  /**
   * Atualiza o status e dados de uma tarefa
   */
  async updateTaskStatus(
    id: number,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findOne(id);

    await task.update(updateTaskDto);

    this.logger.log(
      `Task ${id} updated - Status: ${task.status}, Progress: ${task.progress}%`,
    );

    return task;
  }

  /**
   * Atualiza o progresso de uma tarefa
   */
  async updateProgress(id: number, progress: number): Promise<Task> {
    const task = await this.findOne(id);

    await task.update({ progress });

    this.logger.log(`Task ${id} progress updated: ${progress}%`);

    return task;
  }

  /**
   * Marca uma tarefa como completa
   */
  async markAsCompleted(id: number): Promise<Task> {
    const task = await this.findOne(id);

    await task.update({
      status: TaskStatus.COMPLETED,
      progress: 100,
    });

    this.logger.log(`Task ${id} completed successfully`);

    return task;
  }

  /**
   * Marca uma tarefa como falha
   */
  async markAsFailed(id: number, errorMessage: string): Promise<Task> {
    const task = await this.findOne(id);

    await task.update({
      status: TaskStatus.FAILED,
      error_message: errorMessage,
    });

    this.logger.error(`Task ${id} failed: ${errorMessage}`);

    return task;
  }

  /**
   * Lista todas as tarefas
   */
  async findAll(): Promise<Task[]> {
    return this.taskModel.findAll({
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Lista tarefas por tipo
   */
  async findByType(type: TaskType): Promise<Task[]> {
    return this.taskModel.findAll({
      where: { type },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Lista tarefas em processamento
   */
  async findProcessing(): Promise<Task[]> {
    return this.taskModel.findAll({
      where: { status: TaskStatus.PROCESSING },
      order: [['created_at', 'ASC']],
    });
  }
}
