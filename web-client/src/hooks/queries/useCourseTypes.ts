import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { CourseType } from '@/interfaces/course-type';
import type { CourseTypeQuery } from '@/interfaces/course-type/course-type-query';
import type { PaginatedResponse } from '@/interfaces/paginated-response';

const fetchCourseTypes = (params?: CourseTypeQuery) =>
  api.get<PaginatedResponse<CourseType>>('/api/course-type', { params });

export function useCourseTypes(params?: CourseTypeQuery) {
  return useQuery({
    queryKey: ['course-types', params],
    queryFn: () => fetchCourseTypes(params),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCourseTypeById(id: number | null | undefined) {
  return useQuery({
    queryKey: ['course-type', id],
    queryFn: async () => {
      const { data } = await api.get<CourseType>(`/api/course-type/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
