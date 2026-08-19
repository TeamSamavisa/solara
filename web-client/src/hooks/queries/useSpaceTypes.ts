import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { SpaceType } from '@/interfaces/space-type';
import type { SpaceTypeQuery } from '@/interfaces/space-type/space-type-query';
import type { PaginatedResponse } from '@/interfaces/paginated-response';

const fetchSpaceTypes = (params?: SpaceTypeQuery) =>
  api.get<PaginatedResponse<SpaceType>>('/api/space-type', { params });

export function useSpaceTypes(params?: SpaceTypeQuery) {
  return useQuery({
    queryKey: ['space-types', params],
    queryFn: () => fetchSpaceTypes(params),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSpaceTypeById(id: number | null | undefined) {
  return useQuery({
    queryKey: ['space-type', id],
    queryFn: async () => {
      const { data } = await api.get<SpaceType>(`/api/space-type/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
