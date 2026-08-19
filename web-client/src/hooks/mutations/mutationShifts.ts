/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Shift } from '@/interfaces/shift';
import type { CreateShift } from '@/interfaces/shift/create-shift';
import type { UpdateShift } from '@/interfaces/shift/update-shift';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const createShift = (shift: CreateShift) =>
  api.post<Shift>('/api/shift', shift);

export const useCreateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shift: CreateShift) => createShift(shift),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Sucesso', {
        description: 'Turno cadastrado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível criar o turno. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const updateShift = ({ id, ...data }: UpdateShift) =>
  api.patch<Shift>(`/api/shift/${id}`, data);

export const useUpdateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shift: UpdateShift) => updateShift(shift),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', variables.id] });

      toast.success('Sucesso', {
        description: 'Turno atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar o turno. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const deleteShift = (id: number) => api.delete(`/api/shift/${id}`);

export const useDeleteShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteShift(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.removeQueries({ queryKey: ['shift', id] });

      toast.success('Sucesso', {
        description: 'Turno excluído com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir o turno. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};
