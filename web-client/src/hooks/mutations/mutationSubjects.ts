/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Subject } from '@/interfaces/subject';
import type { CreateSubject } from '@/interfaces/subject/create-subject';
import type { UpdateSubject } from '@/interfaces/subject/update-subject';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const createSubject = (subject: CreateSubject) =>
  api.post<Subject>('/api/subject', subject);

export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subject: CreateSubject) => createSubject(subject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Sucesso', {
        description: 'Disciplina cadastrada com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível criar a disciplina. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const updateSubject = ({ id, ...data }: UpdateSubject) =>
  api.patch<Subject>(`/api/subject/${id}`, data);

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subject: UpdateSubject) => updateSubject(subject),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subject', variables.id] });

      toast.success('Sucesso', {
        description: 'Disciplina atualizada com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar a disciplina. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const deleteSubject = (id: number) => api.delete(`/api/subject/${id}`);

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSubject(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.removeQueries({ queryKey: ['subject', id] });

      toast.success('Sucesso', {
        description: 'Disciplina excluída com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir a disciplina. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};
