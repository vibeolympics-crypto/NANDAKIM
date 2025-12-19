/**
 * Frontend Error Handler
 * Requirements: 24.1, 24.2, 24.3, 24.4
 *
 * Provides:
 * - User-friendly error messages
 * - Error type detection
 * - Retry logic for network errors
 * - Toast notifications for errors
 */

import { ApiError } from './api';

/**
 * Error types for frontend handling
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * User-friendly error messages
 * Requirement 24.2: User-friendly error messages
 */
const errorMessages: Record<string, string> = {
  // Network errors
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  TIMEOUT: '요청 시간이 초과되었습니다. 다시 시도해주세요.',

  // Authentication errors
  UNAUTHORIZED: '로그인이 필요합니다.',
  TOKEN_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',
  INVALID_TOKEN: '인증 정보가 유효하지 않습니다. 다시 로그인해주세요.',
  INVALID_CREDENTIALS: '아이디 또는 비밀번호가 올바르지 않습니다.',
  TWO_FACTOR_REQUIRED: '2단계 인증 코드를 입력해주세요.',
  INVALID_2FA_CODE: '2단계 인증 코드가 올바르지 않습니다.',

  // Authorization errors
  FORBIDDEN: '이 작업을 수행할 권한이 없습니다.',
  INSUFFICIENT_PERMISSIONS: '권한이 부족합니다. 관리자에게 문의하세요.',
  CSRF_VALIDATION_FAILED: '보안 검증에 실패했습니다. 페이지를 새로고침해주세요.',

  // Validation errors
  VALIDATION_ERROR: '입력하신 정보를 확인해주세요.',
  MISSING_REQUIRED_FIELDS: '필수 항목을 모두 입력해주세요.',
  INVALID_INPUT: '입력 형식이 올바르지 않습니다.',

  // Not found errors
  NOT_FOUND: '요청하신 페이지를 찾을 수 없습니다.',
  RESOURCE_NOT_FOUND: '요청하신 항목을 찾을 수 없습니다.',

  // Conflict errors
  CONFLICT: '이미 존재하는 데이터입니다.',
  DUPLICATE_ENTRY: '중복된 항목입니다. 다른 값을 사용해주세요.',

  // File upload errors
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다. 더 작은 파일을 선택해주세요.',
  UNSUPPORTED_FILE_TYPE: '지원하지 않는 파일 형식입니다.',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',

  // Server errors
  INTERNAL_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  DATABASE_ERROR: '데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  EXTERNAL_SERVICE_ERROR: '외부 서비스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
  SERVICE_UNAVAILABLE: '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
  STORAGE_FULL: '저장 공간이 부족합니다. 관리자에게 문의하세요.',

  // Default
  UNKNOWN: '알 수 없는 오류가 발생했습니다.',
};

/**
 * Determine error type from error object
 */
export function getErrorType(error: unknown): ErrorType {
  if (error instanceof ApiError) {
    const statusCode = error.statusCode;

    if (!statusCode) {
      return ErrorType.NETWORK;
    }

    if (statusCode === 401) {
      return ErrorType.AUTHENTICATION;
    }

    if (statusCode === 403) {
      return ErrorType.AUTHORIZATION;
    }

    if (statusCode === 400) {
      return ErrorType.VALIDATION;
    }

    if (statusCode === 404) {
      return ErrorType.NOT_FOUND;
    }

    if (statusCode === 429) {
      return ErrorType.RATE_LIMIT;
    }

    if (statusCode === 504) {
      return ErrorType.TIMEOUT;
    }

    if (statusCode >= 500) {
      return ErrorType.SERVER;
    }
  }

  // Check for network errors
  if (error instanceof Error) {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return ErrorType.NETWORK;
    }

    if (error.message.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }
  }

  return ErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message
 * Requirement 24.2: User-friendly error messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Use server-provided user message if available
    const serverError = error.originalError as any;
    if (serverError?.response?.data?.error?.userMessage) {
      return serverError.response.data.error.userMessage;
    }

    // Use code-based message
    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }

    // Use error message
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return errorMessages.UNKNOWN;
}

/**
 * Get error details for display
 */
export function getErrorDetails(error: unknown): {
  type: ErrorType;
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
  canRetry: boolean;
} {
  const type = getErrorType(error);
  const message = getErrorMessage(error);

  let code: string | undefined;
  let statusCode: number | undefined;
  let details: any;

  if (error instanceof ApiError) {
    code = error.code;
    statusCode = error.statusCode;

    // Extract details from server response
    const serverError = error.originalError as any;
    if (serverError?.response?.data?.error?.details) {
      details = serverError.response.data.error.details;
    }
  }

  // Determine if error is retryable
  const canRetry = [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SERVER].includes(type);

  return {
    type,
    message,
    code,
    statusCode,
    details,
    canRetry,
  };
}

/**
 * Check if error is retryable
 * Requirement 24.4: Network error retry logic
 */
export function isRetryableError(error: unknown): boolean {
  const type = getErrorType(error);
  return [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SERVER].includes(type);
}

/**
 * Retry function with exponential backoff
 * Requirement 24.4: Network error retry logic
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't wait after last attempt
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Handle error with toast notification
 * Integrates with toast notification system
 */
export function handleErrorWithToast(
  error: unknown,
  toast?: (options: { title: string; description?: string; variant?: string }) => void
): void {
  const errorDetails = getErrorDetails(error);

  if (toast) {
    toast({
      title: '오류',
      description: errorDetails.message,
      variant: 'destructive',
    });
  } else {
    // Fallback to console if toast is not available
    console.error('Error:', errorDetails);
  }
}

/**
 * Log error to console in development
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`Error${context ? ` in ${context}` : ''}`);
    console.error(error);
    console.groupEnd();
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(details: Record<string, string>): string {
  const errors = Object.entries(details)
    .filter(([_, message]) => message)
    .map(([field, message]) => `${field}: ${message}`);

  return errors.join('\n');
}

/**
 * Error boundary helper for React components
 */
export class ErrorBoundaryError extends Error {
  constructor(
    message: string,
    public readonly componentStack?: string
  ) {
    super(message);
    this.name = 'ErrorBoundaryError';
  }
}
