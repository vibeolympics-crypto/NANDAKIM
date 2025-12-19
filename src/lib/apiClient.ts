/**
 * Unified API Client
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * Features:
 * - Centralized API client for all HTTP requests
 * - Automatic CSRF token management
 * - Authentication token handling with refresh
 * - Request/response interceptors
 * - Retry logic with exponential backoff
 * - Standardized error handling
 */

import { getCsrfToken, refreshCsrfToken } from './csrf';

/**
 * API Client Configuration
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  csrfEnabled: boolean;
}

/**
 * Standardized API Response
 * Requirement 3.4: Standardized error handling
 */
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Request Interceptor Function
 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

/**
 * Response Interceptor Function
 */
export type ResponseInterceptor = (
  response: ApiResponse<any>
) => ApiResponse<any> | Promise<ApiResponse<any>>;

/**
 * Optimistic Update Configuration
 * Requirement 6.3: Optimistic UI updates
 */
export interface OptimisticUpdateConfig<T, TPrevious = T> {
  // The optimistic data to use immediately
  optimisticData?: T;
  // Callback to update UI with optimistic data
  onOptimisticUpdate?: (data: T) => void;
  // Callback to revert UI on error
  onRevert?: (previousData?: TPrevious) => void;
  // Callback to update UI with final data
  onSuccess?: (data: T) => void;
  // Callback for error handling
  onError?: (error: string) => void;
  // Store previous data for revert
  previousData?: TPrevious;
}

/**
 * Request Configuration
 */
export interface RequestConfig extends RequestInit {
  url?: string;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
  skipCsrf?: boolean;
  skipAuth?: boolean;
  skipLogging?: boolean; // Skip logging for this request
  _isTokenRefreshRetry?: boolean; // Internal flag to prevent refresh loops
  _startTime?: number; // Internal timestamp for performance tracking
  optimistic?: OptimisticUpdateConfig<any>; // Optimistic update configuration
}

/**
 * Logging Configuration
 */
export interface LoggingConfig {
  enabled: boolean;
  logRequests: boolean;
  logResponses: boolean;
  logErrors: boolean;
  logPerformance: boolean;
  sensitiveHeaders?: string[]; // Headers to redact in logs
  sensitiveFields?: string[]; // Fields to redact in request/response bodies
}

/**
 * Unified API Client Class
 * Requirement 3.1: Centralized API client
 */
export class ApiClient {
  private config: ApiClientConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private abortControllers: Map<string, AbortController> = new Map();
  private loggingConfig: LoggingConfig;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseURL: config?.baseURL || '',
      timeout: config?.timeout || 10000,
      retries: config?.retries || 3,
      csrfEnabled: config?.csrfEnabled ?? true,
    };

    // Initialize logging configuration
    // Requirement 4.5, 7.5: Logging and monitoring
    this.loggingConfig = {
      enabled: true,
      logRequests: process.env.NODE_ENV === 'development',
      logResponses: process.env.NODE_ENV === 'development',
      logErrors: true,
      logPerformance: true,
      sensitiveHeaders: ['authorization', 'x-csrf-token', 'cookie', 'set-cookie'],
      sensitiveFields: ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'],
    };
  }

  /**
   * Add request interceptor
   * Requirement 3.5: Request/response interceptors
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   * Requirement 3.5: Request/response interceptors
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let modifiedConfig = config;

    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = await interceptor(modifiedConfig);
    }

    return modifiedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
    let modifiedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = await interceptor(modifiedResponse);
    }

    return modifiedResponse;
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;

    if (!params || Object.keys(params).length === 0) {
      return fullUrl;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });

    return `${fullUrl}?${searchParams.toString()}`;
  }

  /**
   * Prepare request headers
   * Requirement 3.2: Automatic CSRF token inclusion
   */
  private async prepareHeaders(method: string, config: RequestConfig): Promise<Headers> {
    const headers = new Headers(config.headers);

    const isFormData = typeof FormData !== 'undefined' && config.body instanceof FormData;
    const isBinaryBody =
      config.body instanceof Blob ||
      config.body instanceof ArrayBuffer ||
      config.body instanceof URLSearchParams;

    // Set default content type if not provided and body is JSON/string
    if (!isFormData && !isBinaryBody) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    } else {
      // Ensure multipart/form-data boundaries are managed by browser
      headers.delete('Content-Type');
    }

    // Add CSRF token for mutating requests
    // Requirement 3.2: Automatically include CSRF tokens
    const isMutatingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

    if (this.config.csrfEnabled && isMutatingRequest && !config.skipCsrf) {
      try {
        const csrfToken = await getCsrfToken();
        headers.set('X-CSRF-Token', csrfToken);
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
        // Continue without CSRF token - server will reject if required
      }
    }

    return headers;
  }

  /**
   * Normalize request body for fetch
   */
  private prepareRequestBody(data?: any): BodyInit | undefined {
    if (data === undefined || data === null) {
      return undefined;
    }

    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return data as BodyInit;
    }

    if (data instanceof Blob || data instanceof ArrayBuffer || data instanceof URLSearchParams) {
      return data as BodyInit;
    }

    if (typeof data === 'string') {
      return data;
    }

    return JSON.stringify(data);
  }

  /**
   * Execute HTTP request with retry logic
   * Requirement 3.3: Handle authentication tokens consistently
   * Requirement 3.4: Standardized error handling
   * Requirement 4.5, 7.5: Logging and monitoring
   * Requirement 6.3: Optimistic UI updates
   */
  private async executeRequest<T>(
    method: string,
    url: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const retries = config.retries ?? this.config.retries;
    const timeout = config.timeout ?? this.config.timeout;

    // Add start time for performance tracking
    config._startTime = Date.now();

    // Handle optimistic updates
    // Requirement 6.3: Update UI immediately on mutation
    if (config.optimistic?.optimisticData && config.optimistic?.onOptimisticUpdate) {
      try {
        config.optimistic.onOptimisticUpdate(config.optimistic.optimisticData);
      } catch (optimisticError) {
        console.error('Optimistic update callback failed:', optimisticError);
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Apply request interceptors
        const interceptedConfig = await this.applyRequestInterceptors({
          ...config,
          method,
          url,
        });

        // Build URL with params
        const fullUrl = this.buildUrl(url, interceptedConfig.params);

        // Prepare headers
        const headers = await this.prepareHeaders(method, interceptedConfig);

        // Log request
        this.logRequest(method, fullUrl, { ...interceptedConfig, headers });

        // Create abort controller for timeout
        const abortController = new AbortController();
        const requestId = `${method}-${url}-${Date.now()}`;
        this.abortControllers.set(requestId, abortController);

        // Set timeout
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, timeout);

        try {
          // Execute fetch request
          const response = await fetch(fullUrl, {
            method,
            headers,
            body: interceptedConfig.body,
            credentials: 'include', // Include cookies for JWT
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);
          this.abortControllers.delete(requestId);

          // Parse response
          let data: any;

          try {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              data = await response.json();
            } else {
              data = await response.text();
            }
          } catch (parseError) {
            // If parsing fails, use empty object
            data = {};
          }

          // Handle HTTP errors
          if (!response.ok) {
            // Check if error is retryable (5xx errors)
            const isServerError = response.status >= 500;
            const isLastAttempt = attempt === retries - 1;

            if (isServerError && !isLastAttempt) {
              // Throw error to trigger retry
              throw new Error(
                `HTTP ${response.status}: ${data.error || data.message || 'Server error'}`
              );
            }

            // Not retryable or last attempt, handle error
            const errorResponse = await this.handleErrorResponse<T>(
              response.status,
              data,
              method,
              url,
              config
            );

            // Log error response
            this.logResponse(method, fullUrl, errorResponse, config);

            return errorResponse;
          }

          // Standardize successful response
          const apiResponse: ApiResponse<T> = {
            ok: true,
            data: data.data !== undefined ? data.data : data,
            message: data.message,
          };

          // Apply response interceptors
          const finalResponse = await this.applyResponseInterceptors(apiResponse);

          // Handle optimistic update success
          // Requirement 6.3: Update UI with final data
          if (config.optimistic?.onSuccess && finalResponse.data) {
            try {
              config.optimistic.onSuccess(finalResponse.data);
            } catch (successError) {
              console.error('Optimistic success callback failed:', successError);
            }
          }

          // Log successful response
          this.logResponse(method, fullUrl, finalResponse, config);

          // Log performance metrics
          const duration = Date.now() - config._startTime!;
          this.logPerformance(method, fullUrl, duration, config);

          return finalResponse;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          this.abortControllers.delete(requestId);
          throw fetchError;
        }
      } catch (error) {
        lastError = error as Error;

        // Log error
        this.logError(method, url, lastError, config);

        // Check if error is retryable
        const isLastAttempt = attempt === retries - 1;
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || isLastAttempt) {
          // Don't retry, return error response
          const errorResponse: ApiResponse<T> = {
            ok: false,
            error: lastError.message || 'Request failed',
            message: this.getErrorMessage(lastError),
          };

          // Handle optimistic update failure - revert changes
          // Requirement 6.3: Revert on error
          if (config.optimistic?.onRevert) {
            try {
              config.optimistic.onRevert(config.optimistic.previousData);
            } catch (revertError) {
              console.error('Optimistic revert callback failed:', revertError);
            }
          }

          // Call error callback if provided
          if (config.optimistic?.onError) {
            try {
              config.optimistic.onError(errorResponse.error || 'Request failed');
            } catch (errorCallbackError) {
              console.error('Optimistic error callback failed:', errorCallbackError);
            }
          }

          return errorResponse;
        }

        // Wait before retrying with exponential backoff
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Should not reach here, but just in case
    const errorResponse: ApiResponse<T> = {
      ok: false,
      error: lastError?.message || 'Max retries reached',
      message: 'Request failed after multiple attempts',
    };

    // Handle optimistic update failure - revert changes
    // Requirement 6.3: Revert on error
    if (config.optimistic?.onRevert) {
      try {
        config.optimistic.onRevert(config.optimistic.previousData);
      } catch (revertError) {
        console.error('Optimistic revert callback failed:', revertError);
      }
    }

    // Call error callback if provided
    if (config.optimistic?.onError) {
      try {
        config.optimistic.onError(errorResponse.error || 'Request failed');
      } catch (errorCallbackError) {
        console.error('Optimistic error callback failed:', errorCallbackError);
      }
    }

    return errorResponse;
  }

  /**
   * Handle error responses
   * Requirement 3.3: Handle authentication tokens consistently
   */
  private async handleErrorResponse<T>(
    status: number,
    data: any,
    method: string,
    url: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    // Handle 401 Unauthorized - Token expired
    // Only attempt refresh if this is not already a post-refresh retry
    if (status === 401 && data?.code === 'TOKEN_EXPIRED' && !config._isTokenRefreshRetry) {
      try {
        // Attempt to refresh token
        await this.post('/api/admin/auth/refresh');

        // Retry original request with flag to prevent refresh loop
        return await this.executeRequest<T>(method, url, {
          ...config,
          retries: 1, // Only retry once after refresh
          _isTokenRefreshRetry: true, // Prevent additional refresh attempts
        });
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }

        return {
          ok: false,
          error: 'Authentication failed',
          message: 'Session expired. Please login again.',
        };
      }
    }

    // Handle 403 Forbidden - CSRF validation failed
    if (status === 403 && data?.code === 'CSRF_VALIDATION_FAILED') {
      try {
        // Refresh CSRF token
        await refreshCsrfToken();

        // Retry original request
        return await this.executeRequest<T>(method, url, {
          ...config,
          retries: 1, // Only retry once after CSRF refresh
        });
      } catch (csrfError) {
        return {
          ok: false,
          error: 'CSRF validation failed',
          message: 'Security validation failed. Please refresh the page.',
        };
      }
    }

    // Handle 429 Too Many Requests
    if (status === 429) {
      return {
        ok: false,
        error: 'Rate limit exceeded',
        message: data?.message || 'Too many requests. Please try again later.',
      };
    }

    // Return standardized error response
    return {
      ok: false,
      error: data?.error || `HTTP ${status}`,
      message: data?.message || this.getStatusMessage(status),
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors (TypeError from fetch)
      if (error.name === 'TypeError') {
        return true;
      }

      // Timeout errors
      if (error.name === 'AbortError') {
        return true;
      }

      // Server errors (5xx)
      if (error.message.includes('HTTP 5')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: Error): string {
    if (error.name === 'AbortError') {
      return 'Request timeout. Please try again.';
    }

    if (error.message.includes('fetch')) {
      return 'Network error. Please check your connection.';
    }

    return error.message || 'An error occurred';
  }

  /**
   * Get status message for HTTP status codes
   */
  private getStatusMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Bad request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not found',
      429: 'Too many requests',
      500: 'Internal server error',
      502: 'Bad gateway',
      503: 'Service unavailable',
      504: 'Gateway timeout',
    };

    return messages[status] || `HTTP error ${status}`;
  }

  /**
   * GET request
   * Requirement 3.1: Centralized API client
   */
  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('GET', url, config);
  }

  /**
   * POST request
   * Requirement 3.1: Centralized API client
   * Requirement 3.2: Automatic CSRF token inclusion
   */
  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('POST', url, {
      ...config,
      body: this.prepareRequestBody(data),
    });
  }

  /**
   * PUT request
   * Requirement 3.1: Centralized API client
   * Requirement 3.2: Automatic CSRF token inclusion
   */
  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('PUT', url, {
      ...config,
      body: this.prepareRequestBody(data),
    });
  }

  /**
   * PATCH request
   * Requirement 3.1: Centralized API client
   * Requirement 3.2: Automatic CSRF token inclusion
   */
  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('PATCH', url, {
      ...config,
      body: this.prepareRequestBody(data),
    });
  }

  /**
   * DELETE request
   * Requirement 3.1: Centralized API client
   * Requirement 3.2: Automatic CSRF token inclusion
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('DELETE', url, config);
  }

  /**
   * POST request with optimistic update
   * Requirement 6.3: Optimistic UI updates
   *
   * @example
   * ```typescript
   * const response = await apiClient.postOptimistic(
   *   '/api/admin/content/blog',
   *   newBlogPost,
   *   {
   *     optimisticData: newBlogPost,
   *     onOptimisticUpdate: (data) => setBlogPosts([...blogPosts, data]),
   *     onRevert: () => setBlogPosts(blogPosts),
   *     onSuccess: (data) => setBlogPosts([...blogPosts, data]),
   *     onError: (error) => showError(error),
   *     previousData: blogPosts
   *   }
   * );
   * ```
   */
  async postOptimistic<T, TPrevious = T>(
    url: string,
    data: any,
    optimistic: OptimisticUpdateConfig<T, TPrevious>,
    config?: Omit<RequestConfig, 'optimistic'>
  ): Promise<ApiResponse<T>> {
    return this.post<T>(url, data, {
      ...config,
      optimistic,
    });
  }

  /**
   * PUT request with optimistic update
   * Requirement 6.3: Optimistic UI updates
   */
  async putOptimistic<T, TPrevious = T>(
    url: string,
    data: any,
    optimistic: OptimisticUpdateConfig<T, TPrevious>,
    config?: Omit<RequestConfig, 'optimistic'>
  ): Promise<ApiResponse<T>> {
    return this.put<T>(url, data, {
      ...config,
      optimistic,
    });
  }

  /**
   * PATCH request with optimistic update
   * Requirement 6.3: Optimistic UI updates
   */
  async patchOptimistic<T, TPrevious = T>(
    url: string,
    data: any,
    optimistic: OptimisticUpdateConfig<T, TPrevious>,
    config?: Omit<RequestConfig, 'optimistic'>
  ): Promise<ApiResponse<T>> {
    return this.patch<T>(url, data, {
      ...config,
      optimistic,
    });
  }

  /**
   * DELETE request with optimistic update
   * Requirement 6.3: Optimistic UI updates
   */
  async deleteOptimistic<T, TPrevious = T>(
    url: string,
    optimistic: OptimisticUpdateConfig<T, TPrevious>,
    config?: Omit<RequestConfig, 'optimistic'>
  ): Promise<ApiResponse<T>> {
    return this.delete<T>(url, {
      ...config,
      optimistic,
    });
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Update logging configuration
   * Requirement 4.5, 7.5: Logging configuration
   */
  updateLoggingConfig(config: Partial<LoggingConfig>): void {
    this.loggingConfig = {
      ...this.loggingConfig,
      ...config,
    };
  }

  /**
   * Redact sensitive data from logs
   */
  private redactSensitiveData(data: any, type: 'headers' | 'body'): any {
    if (!data) return data;

    const sensitiveKeys =
      type === 'headers' ? this.loggingConfig.sensitiveHeaders : this.loggingConfig.sensitiveFields;

    if (!sensitiveKeys || sensitiveKeys.length === 0) return data;

    // Handle Headers object
    if (data instanceof Headers) {
      const redacted: Record<string, string> = {};
      data.forEach((value, key) => {
        const isRedacted = sensitiveKeys.some((sensitive) =>
          key.toLowerCase().includes(sensitive.toLowerCase())
        );
        redacted[key] = isRedacted ? '[REDACTED]' : value;
      });
      return redacted;
    }

    // Handle plain objects
    if (typeof data === 'object' && data !== null) {
      const redacted: any = Array.isArray(data) ? [] : {};

      for (const [key, value] of Object.entries(data)) {
        const isRedacted = sensitiveKeys.some((sensitive) =>
          key.toLowerCase().includes(sensitive.toLowerCase())
        );

        if (isRedacted) {
          redacted[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          redacted[key] = this.redactSensitiveData(value, type);
        } else {
          redacted[key] = value;
        }
      }

      return redacted;
    }

    return data;
  }

  /**
   * Log API request
   * Requirement 4.5, 7.5: Log all API calls in development
   */
  private logRequest(method: string, url: string, config: RequestConfig): void {
    if (!this.loggingConfig.enabled || !this.loggingConfig.logRequests || config.skipLogging) {
      return;
    }

    const logData: any = {
      type: 'API_REQUEST',
      method,
      url,
      timestamp: new Date().toISOString(),
    };

    // Add headers (redacted)
    if (config.headers) {
      logData.headers = this.redactSensitiveData(config.headers, 'headers');
    }

    // Add body (redacted)
    if (config.body) {
      try {
        const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
        logData.body = this.redactSensitiveData(body, 'body');
      } catch {
        logData.body = '[Unable to parse]';
      }
    }

    // Add query params
    if (config.params) {
      logData.params = config.params;
    }

    console.log('[API Request]', logData);
  }

  /**
   * Log API response
   * Requirement 4.5, 7.5: Log all API calls in development
   */
  private logResponse<T>(
    method: string,
    url: string,
    response: ApiResponse<T>,
    config: RequestConfig
  ): void {
    if (!this.loggingConfig.enabled || !this.loggingConfig.logResponses || config.skipLogging) {
      return;
    }

    const duration = config._startTime ? Date.now() - config._startTime : 0;

    const logData: any = {
      type: 'API_RESPONSE',
      method,
      url,
      ok: response.ok,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    // Add response data (redacted)
    if (response.data) {
      logData.data = this.redactSensitiveData(response.data, 'body');
    }

    // Add error info
    if (response.error) {
      logData.error = response.error;
    }

    if (response.message) {
      logData.message = response.message;
    }

    console.log('[API Response]', logData);
  }

  /**
   * Log API error
   * Requirement 4.5, 7.5: Log errors and security events in production
   */
  private logError(method: string, url: string, error: Error, config: RequestConfig): void {
    if (!this.loggingConfig.enabled || !this.loggingConfig.logErrors) {
      return;
    }

    const duration = config._startTime ? Date.now() - config._startTime : 0;

    const logData: any = {
      type: 'API_ERROR',
      method,
      url,
      error: error.message,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      logData.stack = error.stack;
    }

    console.error('[API Error]', logData);

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(error, { method, url, duration });
    }
  }

  /**
   * Log performance metrics
   * Requirement 4.5, 7.5: Add performance monitoring
   */
  private logPerformance(
    method: string,
    url: string,
    duration: number,
    config: RequestConfig
  ): void {
    if (!this.loggingConfig.enabled || !this.loggingConfig.logPerformance || config.skipLogging) {
      return;
    }

    // Only log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn('[API Performance]', {
        type: 'SLOW_REQUEST',
        method,
        url,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    // Send performance metrics to monitoring service
    if (typeof window !== 'undefined' && (window as any).performance) {
      try {
        // Use Performance API if available
        performance.mark(`api-${method}-${url}-end`);
      } catch {
        // Ignore if performance API not available
      }
    }
  }

  /**
   * Send error to tracking service (Sentry, etc.)
   * Requirement 4.5, 7.5: Set up error tracking
   */
  private sendToErrorTracking(error: Error, context: Record<string, any>): void {
    // Check if Sentry is available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        (window as any).Sentry.captureException(error, {
          tags: {
            type: 'api_error',
            method: context.method,
          },
          extra: context,
        });
      } catch (sentryError) {
        console.error('Failed to send error to Sentry:', sentryError);
      }
    }

    // You can add other error tracking services here
    // Example: LogRocket, Rollbar, etc.
  }
}

/**
 * Default API client instance
 * Requirement 3.1: Centralized API client
 */
export const apiClient = new ApiClient({
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '',
  timeout: 10000,
  retries: 3,
  csrfEnabled: true,
});

/**
 * Convenience export for direct usage
 */
export default apiClient;
