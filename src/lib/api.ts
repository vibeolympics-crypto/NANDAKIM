/**
 * Centralized API client with axios
 * Features:
 * - Automatic token inclusion via interceptors
 * - Centralized error handling
 * - Request/response interceptors
 * - Type-safe API calls
 * - Automatic retry with exponential backoff
 * - CSRF protection for state-changing requests
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getCsrfToken, refreshCsrfToken } from './csrf';

/**
 * Custom API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
    public readonly url?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API Request options
 */
export interface ApiRequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  retries?: number;
  retryDelay?: number;
}

/**
 * BlogPost data model
 */
export interface BlogPost {
  id: string;
  title: string;
  date: string;
  summary: string;
  excerpt?: string;
  content: string;
  author: string;
  category?: string;
  tags: string[];
  image?: string;
  thumbnail?: string; // 이미지 URL의 별칭
  readTime?: number | string;
  featured?: boolean;
  status?: string;
  url?: string;
}

/**
 * SNSFeed data model
 */
export interface SNSFeed {
  id: string;
  platform: 'twitter' | 'threads' | 'instagram' | 'youtube';
  content: string;
  image?: string;
  video?: string;
  url: string;
  timestamp: string;
  likes?: number;
  comments?: number;
}

/**
 * Create axios instance with default configuration
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Include cookies for JWT
  });

  // Request interceptor - Add CSRF token for state-changing requests
  instance.interceptors.request.use(
    async (config) => {
      // Add CSRF token for POST, PUT, PATCH, DELETE requests
      const method = config.method?.toUpperCase();
      if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        try {
          const csrfToken = await getCsrfToken();
          config.headers['X-CSRF-Token'] = csrfToken;
        } catch (error) {
          console.error('Failed to get CSRF token:', error);
          // Continue without CSRF token - server will reject if required
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle common errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle 401 Unauthorized - Token expired
      if (error.response?.status === 401 && !originalRequest._retry) {
        const errorData = error.response.data as { code?: string };

        // If token expired, try to refresh
        if (errorData?.code === 'TOKEN_EXPIRED') {
          originalRequest._retry = true;

          try {
            // Attempt to refresh token
            await instance.post('/api/admin/auth/refresh');

            // Retry original request
            return instance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
              window.location.href = '/admin/login';
            }
            return Promise.reject(refreshError);
          }
        } else {
          // Not a token expiration, redirect to login
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          }
        }
      }

      // Handle 403 Forbidden - Could be CSRF or permissions
      if (error.response?.status === 403) {
        const errorData = error.response.data as { code?: string };

        // If CSRF validation failed, try to refresh token and retry
        if (errorData?.code === 'CSRF_VALIDATION_FAILED' && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Refresh CSRF token
            await refreshCsrfToken();

            // Retry original request (interceptor will add new token)
            return instance(originalRequest);
          } catch (csrfError) {
            console.error('Failed to refresh CSRF token:', csrfError);
            return Promise.reject(csrfError);
          }
        }

        // Otherwise it's a permissions issue
        console.error('Access denied:', error.response.data);
      }

      // Handle 429 Too Many Requests - Rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        console.warn(`Rate limited. Retry after: ${retryAfter} seconds`);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Singleton API client instance
 */
export const apiClient = createApiClient();

/**
 * Generic API request function with retry logic
 */
async function apiRequest<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { retries = 3, retryDelay = 1000, ...axiosConfig } = options;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await apiClient.request<T>({
        method,
        url,
        ...axiosConfig,
      });

      return response.data;
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;
      const axiosError = error as AxiosError;

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (
        axiosError.response?.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        if (axiosError.response.status !== 429) {
          throw new ApiError(
            axiosError.message || 'Request failed',
            axiosError.response.status,
            (axiosError.response.data as { code?: string })?.code,
            url,
            error
          );
        }
      }

      if (isLastAttempt) {
        throw new ApiError(
          axiosError.message || 'Request failed after retries',
          axiosError.response?.status,
          (axiosError.response?.data as { code?: string })?.code,
          url,
          error
        );
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }

  throw new ApiError('Max retries reached', undefined, undefined, url);
}

/**
 * Convenience methods for different HTTP verbs
 */
export const api = {
  get: <T>(url: string, options?: ApiRequestOptions) => apiRequest<T>('get', url, options),

  post: <T>(url: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>('post', url, { ...options, data }),

  put: <T>(url: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>('put', url, { ...options, data }),

  patch: <T>(url: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>('patch', url, { ...options, data }),

  delete: <T>(url: string, options?: ApiRequestOptions) => apiRequest<T>('delete', url, options),
};

/**
 * Legacy fetchData function for backward compatibility
 * @deprecated Use api.get() instead
 */
export async function fetchData<T>(
  url: string,
  options: { timeout?: number; retries?: number; retryDelay?: number } = {}
): Promise<T> {
  return api.get<T>(url, {
    timeout: options.timeout,
    retries: options.retries,
    retryDelay: options.retryDelay,
  });
}

/**
 * Project data model
 */
export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  url?: string;
  github?: string;
  featured?: boolean;
}

/**
 * Event data model
 */
export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image?: string;
  url?: string;
}

/**
 * News item data model
 */
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  description?: string;
  content?: string;
  source: string;
  category?: string;
  date: string;
  image: string;
  thumbnail?: string; // 이미지 URL의 별칭
  url: string;
}

/**
 * Data loading functions using the new API client
 */

/**
 * Load projects data from content API
 */
export async function loadProjects(options?: ApiRequestOptions) {
  try {
    // Try to load from content API first
    const response = await api.get<{ ok: boolean; data: Project[] }>(
      '/api/content/projects',
      options
    );
    return { projects: response.data };
  } catch (error) {
    // Fallback to static JSON if API fails
    console.warn('Failed to load projects from API, falling back to static data:', error);
    return api.get<{ projects: Project[] }>('/src/data/projects.json', options);
  }
}

/**
 * Load events data
 */
export async function loadEvents(options?: ApiRequestOptions) {
  return api.get<{ events: Event[] }>('/src/data/events.json', options);
}

/**
 * Load news data
 */
export async function loadNews(options?: ApiRequestOptions) {
  return api.get<{ news: NewsItem[] }>('/src/data/news.json', options);
}

/**
 * Load configuration data
 */
export async function loadConfig(options?: ApiRequestOptions) {
  return api.get<any>('/src/data/config.json', options);
}

/**
 * Load blog posts data from content API
 */
export async function loadBlog(options?: ApiRequestOptions) {
  try {
    // Try to load from content API first
    const response = await api.get<{ ok: boolean; data: BlogPost[] }>('/api/content/blog', options);
    return { posts: response.data };
  } catch (error) {
    // Fallback to static JSON if API fails
    console.warn('Failed to load blog from API, falling back to static data:', error);
    return api.get<{ posts: BlogPost[] }>('/src/data/blog.json', options);
  }
}

/**
 * Load SNS feeds data from content API
 */
export async function loadSNS(options?: ApiRequestOptions) {
  try {
    // Try to load from content API first
    const response = await api.get<{ ok: boolean; data: SNSFeed[] }>('/api/content/sns', options);
    return { feeds: response.data };
  } catch (error) {
    // Fallback to static JSON if API fails
    console.warn('Failed to load SNS from API, falling back to static data:', error);
    return api.get<{ feeds: SNSFeed[] }>('/src/data/sns.json', options);
  }
}

/**
 * Admin API functions
 */

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  ok: boolean;
  role?: string;
  message?: string;
}

export interface AuthMeResponse {
  ok: boolean;
  user?: {
    username: string;
    role: string;
  };
  message?: string;
}

/**
 * Admin authentication API
 */
export const authApi = {
  /**
   * Login to admin panel
   */
  login: (credentials: LoginCredentials) =>
    api.post<LoginResponse>('/api/admin/auth/login', credentials),

  /**
   * Logout from admin panel
   */
  logout: () => api.post<{ ok: boolean }>('/api/admin/auth/logout'),

  /**
   * Refresh authentication token
   */
  refresh: () => api.post<{ ok: boolean; message: string }>('/api/admin/auth/refresh'),

  /**
   * Get current user information
   */
  me: () => api.get<AuthMeResponse>('/api/admin/auth/me'),
};

/**
 * Admin content API
 */
export const contentApi = {
  /**
   * Save content
   */
  save: (data: { title: string; content: string; email?: string; url?: string; tags?: string[] }) =>
    api.post('/api/admin/content/save', data),

  /**
   * Get dashboard data
   */
  getDashboard: () => api.get('/api/admin/dashboard'),

  /**
   * Get settings (admin only)
   */
  getSettings: () => api.get('/api/admin/settings'),
};

/**
 * Admin profile API
 */
export const profileApi = {
  /**
   * Update user profile
   */
  update: (data: { username?: string; email?: string; phone?: string; bio?: string }) =>
    api.put('/api/admin/profile', data),
};
