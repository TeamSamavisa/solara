import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data } = await api.post('/api/auth/login', { email, password });

      localStorage.setItem('access_token', data.token);
      localStorage.setItem('refresh_token', data.refreshToken);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },

    onError: (error) => {
      console.log(error);
      throw new Error();
    },
  });
}
