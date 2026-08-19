import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { Space } from '@/interfaces/space';
import type { SpaceQuery } from '@/interfaces/space/space-query';
import type { PaginatedResponse } from '@/interfaces/paginated-response';

const fetchSpaces = (params?: SpaceQuery) =>
  api.get<PaginatedResponse<Space>>('/api/space', { params });

export function useSpaces(params?: SpaceQuery) {
  return useQuery({
    queryKey: ['spaces', params],
    queryFn: () => fetchSpaces(params),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSpaceById(id: number | null | undefined) {
  return useQuery({
    queryKey: ['space', id],
    queryFn: async () => {
      const { data } = await api.get<Space>(`/api/space/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
