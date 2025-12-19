-- 포트폴리오 문의 폼 데이터베이스 설정
-- 닷홈 phpMyAdmin에서 실행하세요

-- 문의 메시지 테이블 생성
CREATE TABLE IF NOT EXISTS `contact_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT '이름',
    `email` VARCHAR(255) NOT NULL COMMENT '이메일',
    `subject` VARCHAR(255) NOT NULL COMMENT '제목',
    `message` TEXT NOT NULL COMMENT '메시지 내용',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT '접속 IP',
    `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '브라우저 정보',
    `is_read` TINYINT(1) DEFAULT 0 COMMENT '읽음 여부 (0: 미읽음, 1: 읽음)',
    `created_at` DATETIME NOT NULL COMMENT '생성 시간',
    `read_at` DATETIME DEFAULT NULL COMMENT '읽은 시간',
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_email` (`email`),
    INDEX `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='포트폴리오 문의 메시지';

-- 테스트 데이터 (선택사항)
-- INSERT INTO contact_messages (name, email, subject, message, created_at)
-- VALUES ('테스트', 'test@example.com', '테스트 문의', '테스트 메시지입니다.', NOW());
