import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { ClassGroup } from '@/interfaces/class-group';
import type { PaginatedResponse } from '@/interfaces/paginated-response';

interface ClassGroupQuery {
  page?: number;
  limit?: number;
  name?: string;
}

const fetchClassGroups = (params?: ClassGroupQuery) =>
  api.get<PaginatedResponse<ClassGroup>>('/api/class-group', { params });

export function useClassGroups(params?: ClassGroupQuery) {
  return useQuery({
    queryKey: ['class-groups', params],
    queryFn: () => fetchClassGroups(params),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useClassGroupById(id: number | null | undefined) {
  return useQuery({
    queryKey: ['class-group', id],
    queryFn: async () => {
      const { data } = await api.get<ClassGroup>(`/api/class-group/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
