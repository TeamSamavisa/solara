/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Schedule } from '@/interfaces/schedule';
import type { CreateSchedule } from '@/interfaces/schedule/create-schedule';
import type { UpdateSchedule } from '@/interfaces/schedule/update-schedule';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const createSchedule = (schedule: CreateSchedule) =>
  api.post<Schedule>('/api/schedule', schedule);

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schedule: CreateSchedule) => createSchedule(schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Sucesso', {
        description: 'Horário cadastrado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível criar o horário. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const updateSchedule = ({ id, ...data }: UpdateSchedule) =>
  api.patch<Schedule>(`/api/schedule/${id}`, data);

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schedule: UpdateSchedule) => updateSchedule(schedule),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', variables.id] });

      toast.success('Sucesso', {
        description: 'Horário atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar o horário. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const deleteSchedule = (id: number) => api.delete(`/api/schedule/${id}`);

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSchedule(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.removeQueries({ queryKey: ['schedule', id] });

      toast.success('Sucesso', {
        description: 'Horário excluído com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir o horário. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};
