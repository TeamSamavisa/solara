/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SpaceType } from '@/interfaces/space-type';
import type { CreateSpaceType } from '@/interfaces/space-type/create-space-type';
import type { UpdateSpaceType } from '@/interfaces/space-type/update-space-type';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const createSpaceType = (spaceType: CreateSpaceType) =>
  api.post<SpaceType>('/api/space-type', spaceType);

export const useCreateSpaceType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (spaceType: CreateSpaceType) => createSpaceType(spaceType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-types'] });
      toast.success('Sucesso', {
        description: 'Tipo de espaço cadastrado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível criar o tipo de espaço. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const updateSpaceType = ({ id, ...data }: UpdateSpaceType) =>
  api.patch<SpaceType>(`/api/space-type/${id}`, data);

export const useUpdateSpaceType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (spaceType: UpdateSpaceType) => updateSpaceType(spaceType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['space-types'] });
      queryClient.invalidateQueries({ queryKey: ['space-type', variables.id] });

      toast.success('Sucesso', {
        description: 'Tipo de espaço atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar o tipo de espaço. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const deleteSpaceType = (id: number) => api.delete(`/api/space-type/${id}`);

export const useDeleteSpaceType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSpaceType(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['space-types'] });
      queryClient.removeQueries({ queryKey: ['space-type', id] });

      toast.success('Sucesso', {
        description: 'Tipo de espaço excluído com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir o tipo de espaço. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};
