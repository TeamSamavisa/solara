/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ScheduleTeacher } from '@/interfaces/schedule-teacher';
import type { CreateScheduleTeacher } from '@/interfaces/schedule-teacher/create-schedule-teacher';
import type { UpdateScheduleTeacher } from '@/interfaces/schedule-teacher/update-schedule-teacher';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const createScheduleTeacher = (scheduleTeacher: CreateScheduleTeacher) =>
  api.post<ScheduleTeacher>('/api/schedule-teacher', scheduleTeacher);

export const useCreateScheduleTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleTeacher: CreateScheduleTeacher) =>
      createScheduleTeacher(scheduleTeacher),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-teachers'] });
      toast.success('Sucesso', {
        description:
          'Associação entre professor e horário cadastrada com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível criar a associação entre professor e horário. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const updateScheduleTeacher = ({ id, ...data }: UpdateScheduleTeacher) =>
  api.patch<ScheduleTeacher>(`/api/schedule-teacher/${id}`, data);

export const useUpdateScheduleTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleTeacher: UpdateScheduleTeacher) =>
      updateScheduleTeacher(scheduleTeacher),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedule-teachers'] });
      queryClient.invalidateQueries({
        queryKey: ['schedule-teacher', variables.id],
      });

      toast.success('Sucesso', {
        description:
          'Associação entre professor e horário atualizada com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar a associação entre professor e horário. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const deleteScheduleTeacher = (id: number) =>
  api.delete(`/api/schedule-teacher/${id}`);

export const useDeleteScheduleTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteScheduleTeacher(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['schedule-teachers'] });
      queryClient.removeQueries({ queryKey: ['schedule-teacher', id] });

      toast.success('Sucesso', {
        description:
          'Associação entre professor e horário excluída com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir a associação entre professor e horário. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};
