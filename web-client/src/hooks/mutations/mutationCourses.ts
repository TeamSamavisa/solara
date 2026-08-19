/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Course } from '@/interfaces/course';
import type { CreateCourse } from '@/interfaces/course/create-course';
import type { UpdateCourse } from '@/interfaces/course/update-course';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const createCourse = (course: CreateCourse) =>
  api.post<Course>('/api/course', course);

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (course: CreateCourse) => createCourse(course),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Sucesso', {
        description: 'Curso cadastrado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível criar o curso. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const updateCourse = ({ id, ...data }: UpdateCourse) =>
  api.patch<Course>(`/api/course/${id}`, data);

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (course: UpdateCourse) => updateCourse(course),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.id] });

      toast.success('Sucesso', {
        description: 'Curso atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar o curso. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const deleteCourse = (id: number) => api.delete(`/api/course/${id}`);

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCourse(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.removeQueries({ queryKey: ['course', id] });

      toast.success('Sucesso', {
        description: 'Curso excluído com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir o curso. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};
