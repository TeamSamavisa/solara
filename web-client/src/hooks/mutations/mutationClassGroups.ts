/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ClassGroup } from '@/interfaces/class-group';
import type { CreateClassGroup } from '@/interfaces/class-group/create-class-group';
import type { UpdateClassGroup } from '@/interfaces/class-group/update-class-group';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const createClassGroup = (classGroup: CreateClassGroup) =>
  api.post<ClassGroup>('/api/class-group', classGroup);

export const useCreateClassGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classGroup: CreateClassGroup) => createClassGroup(classGroup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-groups'] });
      toast.success('Sucesso', {
        description: 'Turma cadastrada com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível criar a turma. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const updateClassGroup = ({ id, ...data }: UpdateClassGroup) =>
  api.patch<ClassGroup>(`/api/class-group/${id}`, data);

export const useUpdateClassGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classGroup: UpdateClassGroup) => updateClassGroup(classGroup),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-groups'] });
      queryClient.invalidateQueries({
        queryKey: ['class-group', variables.id],
      });

      toast.success('Sucesso', {
        description: 'Turma atualizada com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar a turma. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const deleteClassGroup = (id: number) => api.delete(`/api/class-group/${id}`);

export const useDeleteClassGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteClassGroup(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['class-groups'] });
      queryClient.removeQueries({ queryKey: ['class-group', id] });

      toast.success('Sucesso', {
        description: 'Turma excluída com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir a turma. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};
