# 닷홈 데이터베이스 설정 가이드

포트폴리오 사이트의 Get In Touch 폼을 위한 닷홈 무료 호스팅 설정 방법입니다.

## 1. 닷홈 무료 호스팅 신청

1. [닷홈](https://www.dothome.co.kr) 접속
2. 회원가입 후 **무료 호스팅** 신청
3. 호스팅 신청 시 **MySQL** 옵션 선택

## 2. 데이터베이스 생성

1. 닷홈 마이페이지 → 나의 서비스 관리
2. **phpMyAdmin** 접속
3. `setup_database.sql` 파일의 SQL 쿼리 실행
4. `contact_messages` 테이블이 생성되었는지 확인

## 3. PHP 파일 설정

### config.php 수정

닷홈에서 제공받은 정보로 수정:

```php
define('DB_HOST', 'localhost');           // 보통 localhost
define('DB_NAME', 'your_database_name');  // DB명 (예: user_db)
define('DB_USER', 'your_username');       // 사용자명
define('DB_PASS', 'your_password');       // 비밀번호

// 포트폴리오 사이트 주소로 변경
define('ALLOWED_ORIGIN', 'https://your-site.pages.dev');
```

## 4. 파일 업로드

1. FTP 클라이언트 (FileZilla 등) 사용
2. 닷홈 FTP 정보:
   - 호스트: ftp.dothome.co.kr
   - 사용자명: 닷홈 ID
   - 비밀번호: 닷홈 비밀번호
3. `html` 폴더에 다음 파일 업로드:
   - `config.php`
   - `contact.php`

## 5. 프론트엔드 설정

`.env` 파일에 API URL 추가:

```env
VITE_CONTACT_API_URL=https://your-dothome-site.dothome.co.kr/contact.php
```

## 6. 테스트

1. 포트폴리오 사이트에서 문의 폼 작성
2. Send Message 클릭
3. phpMyAdmin에서 `contact_messages` 테이블 확인

## 문제 해결

### CORS 오류
- `config.php`의 `ALLOWED_ORIGIN` 확인
- 브라우저 개발자 도구 → Network 탭에서 오류 확인

### 데이터베이스 연결 오류
- DB 접속 정보 확인
- phpMyAdmin에서 직접 쿼리 테스트

### 500 에러
- PHP 오류 로그 확인 (닷홈 마이페이지 → 오류 로그)
