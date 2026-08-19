import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    error ? prom.reject(error) : prom.resolve(token!);
  });
  failedQueue = [];
};

// request interceptor
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshEndpoint =
      originalRequest.url?.includes('/api/auth/refresh');

    if (error.response?.status === 401 && isRefreshEndpoint) {
      handleAuthError();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        try {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                resolve(api(originalRequest));
              },
              reject: (err: unknown) => reject(err),
            });
          });
        } catch (err) {
          handleAuthError();
          return Promise.reject(err);
        }
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${apiUrl}/api/auth/refresh`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        const { token: accessToken, refreshToken: newRefreshToken } =
          response.data;

        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', newRefreshToken);

        processQueue(null, accessToken);
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        handleAuthError();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

const handleAuthError = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  if (
    !window.location.pathname.startsWith('/error') &&
    !window.location.pathname.startsWith('/login')
  ) {
    window.location.href = '/error/401';
  }
};

export default api;
