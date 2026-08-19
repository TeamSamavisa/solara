import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { ScheduleTeacher } from '@/interfaces/schedule-teacher';
import type { ScheduleTeacherQuery } from '@/interfaces/schedule-teacher/schedule-teacher-query';
import type { PaginatedResponse } from '@/interfaces/paginated-response';

const fetchScheduleTeachers = (params?: ScheduleTeacherQuery) =>
  api.get<PaginatedResponse<ScheduleTeacher>>('/api/schedule-teacher', {
    params,
  });

export function useScheduleTeachers(params?: ScheduleTeacherQuery) {
  return useQuery({
    queryKey: ['schedule-teachers', params],
    queryFn: () => fetchScheduleTeachers(params),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useScheduleTeacherById(id: number | null | undefined) {
  return useQuery({
    queryKey: ['schedule-teacher', id],
    queryFn: async () => {
      const { data } = await api.get<ScheduleTeacher>(
        `/api/schedule-teacher/${id}`,
      );
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
