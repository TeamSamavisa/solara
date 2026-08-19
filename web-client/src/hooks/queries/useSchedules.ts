import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { Schedule } from '@/interfaces/schedule';
import type { ScheduleQuery } from '@/interfaces/schedule/schedule-query';
import type { PaginatedResponse } from '@/interfaces/paginated-response';

const fetchSchedules = (params?: ScheduleQuery) =>
  api.get<PaginatedResponse<Schedule>>('/api/schedule', { params });

export function useSchedules(params?: ScheduleQuery) {
  return useQuery({
    queryKey: ['schedules', params],
    queryFn: () => fetchSchedules(params),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useScheduleById(id: number | null | undefined) {
  return useQuery({
    queryKey: ['schedule', id],
    queryFn: async () => {
      const { data } = await api.get<Schedule>(`/api/schedule/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
