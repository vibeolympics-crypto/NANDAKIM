<?php
/**
 * 닷홈 데이터베이스 설정 파일
 *
 * 사용법:
 * 1. 닷홈에서 무료 호스팅 신청 후 MySQL DB 생성
 * 2. 아래 정보를 닷홈에서 제공받은 정보로 수정
 * 3. dothome 폴더의 모든 파일을 FTP로 업로드
 */

// 데이터베이스 설정 (닷홈에서 제공받은 정보 입력)
define('DB_HOST', 'localhost');           // 호스트 (보통 localhost)
define('DB_NAME', 'your_database_name');  // 데이터베이스 이름
define('DB_USER', 'your_username');       // 사용자 이름
define('DB_PASS', 'your_password');       // 비밀번호
define('DB_CHARSET', 'utf8mb4');          // 문자셋

// CORS 허용 도메인 (포트폴리오 사이트 주소)
define('ALLOWED_ORIGIN', 'https://your-portfolio-site.pages.dev');

// 이메일 알림 설정 (선택사항)
define('ADMIN_EMAIL', 'airroad1004@gmail.com');
define('SEND_EMAIL_NOTIFICATION', false);

/**
 * 데이터베이스 연결 함수
 */
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}

/**
 * CORS 헤더 설정
 */
function setCORSHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // 개발 환경 또는 허용된 도메인에서만 CORS 허용
    $allowedOrigins = [
        ALLOWED_ORIGIN,
        'http://localhost:8093',
        'http://localhost:5173',
        'http://127.0.0.1:8093',
        'http://127.0.0.1:5173',
    ];

    if (in_array($origin, $allowedOrigins) || strpos($origin, '.pages.dev') !== false) {
        header("Access-Control-Allow-Origin: $origin");
    }

    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Max-Age: 86400");
    header("Content-Type: application/json; charset=UTF-8");
}

/**
 * JSON 응답 반환
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
?>
