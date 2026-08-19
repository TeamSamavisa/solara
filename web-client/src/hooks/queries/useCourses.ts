import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { Course } from '@/interfaces/course';
import type { CourseQuery } from '@/interfaces/course/course-query';
import type { PaginatedResponse } from '@/interfaces/paginated-response';

const fetchCourses = (params?: CourseQuery) =>
  api.get<PaginatedResponse<Course>>('/api/course', { params });

export function useCourses(params?: CourseQuery) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => fetchCourses(params),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCourseById(id: number | null | undefined) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data } = await api.get<Course>(`/api/course/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
