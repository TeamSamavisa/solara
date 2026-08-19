import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { Shift } from '@/interfaces/shift';
import type { ShiftQuery } from '@/interfaces/shift/shift-query';
import type { PaginatedResponse } from '@/interfaces/paginated-response';

const fetchShifts = (params?: ShiftQuery) =>
  api.get<PaginatedResponse<Shift>>('/api/shift', { params });

export function useShifts(params?: ShiftQuery) {
  return useQuery({
    queryKey: ['shifts', params],
    queryFn: () => fetchShifts(params),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useShiftById(id: number | null | undefined) {
  return useQuery({
    queryKey: ['shift', id],
    queryFn: async () => {
      const { data } = await api.get<Shift>(`/api/shift/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
