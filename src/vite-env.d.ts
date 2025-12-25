/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API 설정
  readonly VITE_API_BASE_URL?: string;
  
  // 블로그/RSS 설정
  readonly VITE_NOTION_BLOG_API_URL?: string;
  readonly VITE_BLOG_RSS_URL?: string;
  readonly VITE_BLOG_YOUTUBE_CHANNEL?: string;
  
  // 지도 설정
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  
  // 프록시 설정 (선택사항 - Cloudflare Workers 사용 시)
  readonly VITE_RSS_PROXY_URL?: string;
  readonly VITE_RSS_JSON_PROXY_URL?: string;
  readonly VITE_YOUTUBE_PROXY_URL?: string;
  
  // 기타
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
