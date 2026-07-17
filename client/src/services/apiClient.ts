import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

type ApiErrorPayload = {
  error?: {
    message?: string;
    issues?: unknown;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly issues?: unknown;

  constructor(status: number, message: string, issues?: unknown) {
    super(message);
    this.status = status;
    this.issues = issues;
    this.name = 'ApiError';
  }
}

type ApiClientConfig = {
  baseUrl?: string;
  getAccessToken?: () => string | null;
};

class ApiClient {
  private readonly client: AxiosInstance;

  constructor(config: ApiClientConfig = {}) {
    const resolvedBaseUrl = config.baseUrl ?? import.meta.env.VITE_API_URL;

    if (!resolvedBaseUrl) {
      throw new Error('VITE_API_URL is not configured');
    }

    this.client = axios.create({
      baseURL: resolvedBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor to dynamically add authorization header
    this.client.interceptors.request.use(
      (axiosConfig: InternalAxiosRequestConfig) => {
        const token = config.getAccessToken?.();
        if (token) {
          axiosConfig.headers.set('Authorization', `Bearer ${token}`);
        }
        return axiosConfig;
      },
      (error) => Promise.reject(error)
    );
  }

  async request<T>(path: string, options: { method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; data?: unknown }): Promise<T> {
    try {
      const response = await this.client.request<T>({
        url: path,
        method: options.method,
        data: options.data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorPayload>;
        const status = axiosError.response?.status ?? 500;
        const errorPayload = axiosError.response?.data ?? {};
        const message = errorPayload.error?.message ?? axiosError.message ?? 'Request failed';
        const issues = errorPayload.error?.issues;

        throw new ApiError(status, message, issues);
      }
      throw error;
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      data: body,
    });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      data: body,
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE',
    });
  }
}

export const createApiClient = (config?: ApiClientConfig) => new ApiClient(config);
