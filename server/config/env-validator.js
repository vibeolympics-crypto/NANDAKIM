/**
 * 환경 변수 검증 모듈
 * 서버 시작 시 필수 환경 변수를 검증합니다.
 */

// 환경 변수 스키마 정의
const envSchema = {
  // 필수 변수
  required: {
    ADMIN_USERNAME: {
      type: 'string',
      minLength: 3,
      description: 'Admin username for authentication',
    },
    JWT_SECRET: {
      type: 'string',
      minLength: 32,
      description: 'Secret key for JWT token signing',
    },
    TOKEN_EXPIRES: {
      type: 'number',
      min: 300,
      max: 86400,
      description: 'JWT token expiration time in seconds (5min-24h)',
    },
    REFRESH_TOKEN_EXPIRES: {
      type: 'number',
      min: 86400,
      max: 2592000,
      description: 'Refresh token expiration time in seconds (1day-30days)',
    },
  },
  // 선택적 변수 (기본값 포함)
  optional: {
    ADMIN_PASSWORD: {
      type: 'string',
      minLength: 8,
      description: 'Admin password (plain text, for development only)',
      default: null,
    },
    ADMIN_PASSWORD_HASH: {
      type: 'string',
      description: 'Admin password (bcrypt hash, for production)',
      default: null,
    },
    ADMIN_ROLE: {
      type: 'string',
      enum: ['admin', 'editor', 'viewer'],
      description: 'Admin user role',
      default: 'admin',
    },
    CSRF_SECRET: {
      type: 'string',
      minLength: 32,
      description: 'Secret key for CSRF token generation',
      default: 'your-csrf-secret-change-this-in-production',
    },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test'],
      description: 'Node environment',
      default: 'development',
    },
    PORT: {
      type: 'number',
      min: 1024,
      max: 65535,
      description: 'Server port number',
      default: 3001,
    },
    VITE_GOOGLE_MAPS_API_KEY: {
      type: 'string',
      description: 'Google Maps API key',
      default: '',
    },
    VITE_KAKAO_MAPS_API_KEY: {
      type: 'string',
      description: 'Kakao Maps API key',
      default: '',
    },
  },
};

/**
 * 타입별 검증 함수
 */
const validators = {
  string: (value, rules) => {
    if (typeof value !== 'string') return `Must be a string`;
    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be at most ${rules.maxLength} characters`;
    }
    if (rules.enum && !rules.enum.includes(value)) {
      return `Must be one of: ${rules.enum.join(', ')}`;
    }
    return null;
  },
  number: (value, rules) => {
    const num = Number(value);
    if (isNaN(num)) return `Must be a valid number`;
    if (rules.min !== undefined && num < rules.min) {
      return `Must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && num > rules.max) {
      return `Must be at most ${rules.max}`;
    }
    return null;
  },
  boolean: (value) => {
    if (value !== 'true' && value !== 'false') {
      return `Must be 'true' or 'false'`;
    }
    return null;
  },
};

/**
 * 환경 변수 검증
 * @throws {Error} 필수 환경 변수가 없거나 유효하지 않을 경우
 * @returns {Object} 검증 결과 및 경고
 */
export function validateEnv() {
  const errors = [];
  const warnings = [];
  const validated = {};

  // 필수 환경 변수 검증
  for (const [varName, rules] of Object.entries(envSchema.required)) {
    const value = process.env[varName];

    if (!value) {
      errors.push({
        var: varName,
        error: 'Required variable is missing',
        description: rules.description,
      });
      continue;
    }

    const validator = validators[rules.type];
    const error = validator(value, rules);

    if (error) {
      errors.push({
        var: varName,
        error,
        value,
        description: rules.description,
      });
    } else {
      validated[varName] = rules.type === 'number' ? Number(value) : value;
    }
  }

  // 선택적 환경 변수 검증
  for (const [varName, rules] of Object.entries(envSchema.optional)) {
    const value = process.env[varName];

    if (!value) {
      validated[varName] = rules.default;
      continue;
    }

    const validator = validators[rules.type];
    const error = validator(value, rules);

    if (error) {
      warnings.push({
        var: varName,
        warning: error,
        value,
        description: rules.description,
      });
      validated[varName] = rules.default;
    } else {
      validated[varName] = rules.type === 'number' ? Number(value) : value;
    }
  }

  // 패스워드 설정 검증
  if (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH) {
    errors.push({
      var: 'ADMIN_PASSWORD / ADMIN_PASSWORD_HASH',
      error: 'At least one must be set',
      description: 'Use ADMIN_PASSWORD for development, ADMIN_PASSWORD_HASH for production',
    });
  }

  // 프로덕션 환경 보안 검증
  if (validated.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'your_jwt_secret_key_change_in_production') {
      errors.push({
        var: 'JWT_SECRET',
        error: 'Using default value in production',
        description: 'Must use a secure random secret in production',
      });
    }

    if (process.env.CSRF_SECRET === 'your-csrf-secret-change-this-in-production') {
      errors.push({
        var: 'CSRF_SECRET',
        error: 'Using default value in production',
        description: 'Must use a secure random secret in production',
      });
    }

    if (process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH) {
      warnings.push({
        var: 'ADMIN_PASSWORD',
        warning: 'Plain text password in production',
        description: 'Use ADMIN_PASSWORD_HASH with bcrypt hash for production',
      });
    }
  }

  // 에러가 있으면 종료
  if (errors.length > 0) {
    console.error('\n❌ Environment Variable Validation Failed:\n');
    errors.forEach(({ var: v, error, value, description }) => {
      console.error(`   ${v}:`);
      console.error(`     Error: ${error}`);
      if (value) console.error(`     Value: ${value}`);
      console.error(`     Description: ${description}`);
      console.error('');
    });
    console.error('Please check your .env file and fix the errors above.\n');
    throw new Error('Environment validation failed');
  }

  // 경고 출력
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:\n');
    warnings.forEach(({ var: v, warning, value, description }) => {
      console.warn(`   ${v}:`);
      console.warn(`     Warning: ${warning}`);
      if (value) console.warn(`     Value: ${value}`);
      console.warn(`     Description: ${description}`);
      console.warn('');
    });
  }

  // 성공 메시지
  console.log('✅ Environment variables validated successfully\n');

  return {
    valid: true,
    validated,
    warnings: warnings.length,
  };
}

/**
 * 환경 변수 정보 출력 (디버깅용)
 */
export function printEnvInfo() {
  console.log('\n📋 Environment Configuration:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   PORT: ${process.env.PORT || '3001'}`);
  console.log(`   ADMIN_USERNAME: ${process.env.ADMIN_USERNAME}`);
  console.log(`   ADMIN_ROLE: ${process.env.ADMIN_ROLE || 'admin'}`);
  console.log(`   TOKEN_EXPIRES: ${process.env.TOKEN_EXPIRES}s`);
  console.log(`   REFRESH_TOKEN_EXPIRES: ${process.env.REFRESH_TOKEN_EXPIRES}s`);
  console.log(`   Password Method: ${process.env.ADMIN_PASSWORD_HASH ? 'HASH' : 'PLAIN'}`);
  console.log('');
}
