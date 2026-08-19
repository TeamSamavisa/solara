import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export interface Task {
  id: number;
  correlation_id: string;
  type: 'TIMETABLE_OPTIMIZATION';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  result: unknown;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

const fetchTask = async (id: number): Promise<Task> => {
  const response = await api.get<Task>(`/api/tasks/${id}`);
  return response.data;
};

export const useTask = (id: number | null | undefined) => {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => fetchTask(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // continue polling while processing
      if (query.state.data?.status === 'PROCESSING') {
        return 2000; // 2 seconds
      }
      return false;
    },
  });
};

const fetchLastTask = async (): Promise<Task | null> => {
  const response = await api.get<Task>('/api/tasks/last');
  return response.data;
};

export const useLastTask = () => {
  return useQuery({
    queryKey: ['tasks', 'last'],
    queryFn: fetchLastTask,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: (query) => {
      // continue polling while processing
      const status = query.state.data?.status;
      if (status === 'PROCESSING') {
        return 2000; // 2 seconds
      }
      return false;
    },
  });
};

const fetchTasks = async (): Promise<Task[]> => {
  const response = await api.get<Task[]>('/api/tasks');
  return response.data;
};

export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });
};
