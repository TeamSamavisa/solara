/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CourseType } from '@/interfaces/course-type';
import type { CreateCourseType } from '@/interfaces/course-type/create-course-type';
import type { UpdateCourseType } from '@/interfaces/course-type/update-course-type';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const createCourseType = (courseType: CreateCourseType) =>
  api.post<CourseType>('/api/course-type', courseType);

export const useCreateCourseType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseType: CreateCourseType) => createCourseType(courseType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-types'] });
      toast.success('Sucesso', {
        description: 'Tipo de curso cadastrado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível criar o tipo de curso. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const updateCourseType = ({ id, ...data }: UpdateCourseType) =>
  api.patch<CourseType>(`/api/course-type/${id}`, data);

export const useUpdateCourseType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseType: UpdateCourseType) => updateCourseType(courseType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-types'] });
      queryClient.invalidateQueries({
        queryKey: ['course-type', variables.id],
      });

      toast.success('Sucesso', {
        description: 'Tipo de curso atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar o tipo de curso. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};

const deleteCourseType = (id: number) => api.delete(`/api/course-type/${id}`);

export const useDeleteCourseType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCourseType(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['course-types'] });
      queryClient.removeQueries({ queryKey: ['course-type', id] });

      toast.success('Sucesso', {
        description: 'Tipo de curso excluído com sucesso',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir o tipo de curso. Tente novamente.';

      toast.error('Erro', {
        description: message,
      });
      console.error(error);
    },
  });
};
