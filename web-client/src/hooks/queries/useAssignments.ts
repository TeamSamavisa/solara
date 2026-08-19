import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { Assignment } from '@/interfaces/assignment';
import type { AssignmentQuery } from '@/interfaces/assignment';
import type { PaginatedResponse } from '@/interfaces/paginated-response';

const fetchAssignments = (params?: AssignmentQuery) =>
  api.get<PaginatedResponse<Assignment>>('/api/assignment', { params });

export function useAssignments(params?: AssignmentQuery) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => fetchAssignments(params),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAssignmentById(id: number | null | undefined) {
  return useQuery({
    queryKey: ['assignment', id],
    queryFn: async () => {
      const { data } = await api.get<Assignment>(`/api/assignment/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
