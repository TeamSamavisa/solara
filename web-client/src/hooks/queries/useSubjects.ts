import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { Subject } from '@/interfaces/subject';
import type { SubjectQuery } from '@/interfaces/subject/subject-query';
import type { PaginatedResponse } from '@/interfaces/paginated-response';

const fetchSubjects = (params?: SubjectQuery) =>
  api.get<PaginatedResponse<Subject>>('/api/subject', { params });

export function useSubjects(params?: SubjectQuery) {
  return useQuery({
    queryKey: ['subjects', params],
    queryFn: () => fetchSubjects(params),
    select: (response) => response.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSubjectById(id: number | null | undefined) {
  return useQuery({
    queryKey: ['subject', id],
    queryFn: async () => {
      const { data } = await api.get<Subject>(`/api/subject/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
