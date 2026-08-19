/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Space } from '@/interfaces/space';
import type { CreateSpace } from '@/interfaces/space/create-space';
import type { UpdateSpace } from '@/interfaces/space/update-space';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const createSpace = (space: CreateSpace) =>
  api.post<Space>('/api/space', space);

export const useCreateSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (space: CreateSpace) => createSpace(space),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast.success('Sucesso', {
        description: 'Espaço cadastrado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível criar o espaço. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const updateSpace = ({ id, ...data }: UpdateSpace) =>
  api.patch<Space>(`/api/space/${id}`, data);

export const useUpdateSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (space: UpdateSpace) => updateSpace(space),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space', variables.id] });

      toast.success('Sucesso', {
        description: 'Espaço atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar o espaço. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const deleteSpace = (id: number) => api.delete(`/api/space/${id}`);

export const useDeleteSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSpace(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.removeQueries({ queryKey: ['space', id] });

      toast.success('Sucesso', {
        description: 'Espaço excluído com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir o espaço. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};
