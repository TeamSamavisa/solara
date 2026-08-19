/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Assignment } from '@/interfaces/assignment';
import type { CreateAssignment } from '@/interfaces/assignment/create-assignment';
import type { UpdateAssignment } from '@/interfaces/assignment/update-assignment';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const createAssignment = (assignment: CreateAssignment) =>
  api.post<Assignment>('/api/assignment', assignment);

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignment: CreateAssignment) => createAssignment(assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Sucesso', {
        description: 'Professor(a) cadastrado(a) com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível criar a atribuição. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const updateAssignment = ({ id, ...data }: UpdateAssignment) =>
  api.patch<Assignment>(`/api/assignment/${id}`, data);

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignment: UpdateAssignment) => updateAssignment(assignment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', variables.id] });

      toast.success('Sucesso', {
        description: 'Atribuição atualizada com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar a atribuição. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const deleteAssignment = (id: number) => api.delete(`/api/assignment/${id}`);

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAssignment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.removeQueries({ queryKey: ['assignment', id] });

      toast.success('Sucesso', {
        description: 'Atribuição excluída com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir a atribuição. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

interface OptimizeResponse {
  taskId: number;
  correlationId: string;
}

const optimizeTimetable = () =>
  api.post<OptimizeResponse>('/api/timetabling/optimize');

export const useOptimizeTimetable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: optimizeTimetable,
    onSuccess: (response) => {
      // invalidate tasks queries to reflect new optimization task
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'last'] });
      // force refetch to get the latest data immediately
      queryClient.refetchQueries({ queryKey: ['tasks', 'last'] });
      toast.success('Otimização Iniciada', {
        description: `Tarefa #${response.data.taskId} criada. Acompanhe o progresso.`,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível iniciar a otimização. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};
