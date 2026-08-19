import { Controller, Get, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { TimetablingService } from './timetabling.service';

@ApiTags('Timetabling')
@Controller('timetabling')
@ApiBearerAuth()
export class TimetablingController {
  constructor(private readonly timetablingService: TimetablingService) {}

  @Post('optimize')
  @ApiOperation({
    summary: 'Iniciar otimização de horários das alocações pendentes',
    description:
      'Cria uma tarefa de otimização e a processa em background. Retorna imediatamente o ID da tarefa para rastreamento.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tarefa de otimização criada com sucesso',
    schema: {
      example: {
        taskId: 1,
        correlationId: 'optimization-1700000000000-abc123',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erro ao criar tarefa de otimização',
  })
  async optimizeTimetable() {
    return this.timetablingService.optimizeTimetable();
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Obter estatísticas das alocações',
    description:
      'Retorna estatísticas sobre alocações totais, otimizadas e pendentes',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas obtidas com sucesso',
    schema: {
      example: {
        total: 100,
        optimized: 75,
        pending: 25,
        optimizationRate: 75.0,
      },
    },
  })
  async getStatistics() {
    return this.timetablingService.getStatistics();
  }

  @Get('test-connection')
  @ApiOperation({
    summary: 'Testar conexão com o timetabling-service',
    description:
      'Verifica se a conexão com o serviço de otimização está funcionando',
  })
  @ApiResponse({
    status: 200,
    description: 'Conexão estabelecida',
    schema: {
      example: {
        status: 'success',
        message: 'Connection established',
      },
    },
  })
  async testConnection() {
    return this.timetablingService.testConnection();
  }

  @Get('data')
  @ApiOperation({
    summary: 'Visualizar dados que serão enviados para otimização',
    description:
      'Retorna todos os dados coletados que seriam enviados ao timetabling-service (útil para debug)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados coletados com sucesso',
  })
  async getTimetableData() {
    return this.timetablingService.collectTimetableData();
  }
}
