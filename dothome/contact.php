<?php
/**
 * 문의 폼 처리 API
 *
 * 엔드포인트: POST /contact.php
 * 요청 본문: { name, email, subject, message }
 */

require_once 'config.php';

// CORS 헤더 설정
setCORSHeaders();

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// POST 요청만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// JSON 입력 파싱
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    jsonResponse(['error' => 'Invalid JSON input'], 400);
}

// 필수 필드 검증
$requiredFields = ['name', 'email', 'subject', 'message'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        jsonResponse(['error' => "Missing required field: $field"], 400);
    }
}

// 이메일 유효성 검사
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Invalid email address'], 400);
}

// 메시지 길이 검사
if (strlen($data['message']) < 10) {
    jsonResponse(['error' => 'Message must be at least 10 characters'], 400);
}

// 데이터 정제 (XSS 방지)
$name = htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8');
$email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
$subject = htmlspecialchars(trim($data['subject']), ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars(trim($data['message']), ENT_QUOTES, 'UTF-8');
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

// 데이터베이스 연결
$db = getDBConnection();
if (!$db) {
    jsonResponse(['error' => 'Database connection failed'], 500);
}

try {
    // 문의 저장
    $stmt = $db->prepare("
        INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent, created_at)
        VALUES (:name, :email, :subject, :message, :ip_address, :user_agent, NOW())
    ");

    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':subject' => $subject,
        ':message' => $message,
        ':ip_address' => $ipAddress,
        ':user_agent' => substr($userAgent, 0, 500),
    ]);

    $messageId = $db->lastInsertId();

    // 이메일 알림 전송 (옵션)
    if (defined('SEND_EMAIL_NOTIFICATION') && SEND_EMAIL_NOTIFICATION && defined('ADMIN_EMAIL')) {
        $emailSubject = "[포트폴리오 문의] $subject";
        $emailBody = "
새로운 문의가 접수되었습니다.

이름: $name
이메일: $email
제목: $subject

메시지:
$message

---
접수 시간: " . date('Y-m-d H:i:s') . "
IP: $ipAddress
";
        @mail(ADMIN_EMAIL, $emailSubject, $emailBody, "From: noreply@portfolio.com\r\nReply-To: $email");
    }

    jsonResponse([
        'success' => true,
        'messageId' => $messageId,
        'message' => 'Message sent successfully'
    ], 201);

} catch (PDOException $e) {
    error_log("Contact form error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to save message'], 500);
}
?>
