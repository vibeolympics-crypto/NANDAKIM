import { useRef, useState, useEffect } from 'react';
import { Sparkles, Briefcase, Code, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from './ui/button';
import { OptimizedImage } from './OptimizedImage';
import heroBg from '@/assets/hero-bg.jpg';

interface HeroSectionProps {
  theme: 'dark' | 'light';
}

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  publishedAt: string;
}

// CORS 프록시 목록
const YOUTUBE_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

// YouTube RSS URL 직접 사용
const HERO_YOUTUBE_RSS_URLS = [
  'https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA',
  'https://www.youtube.com/feeds/videos.xml?channel_id=UCds72zs2EzQRmhqbLLCmD4A',
  'https://www.youtube.com/feeds/videos.xml?channel_id=UCdNqxwnqpXJpMt47WE7Bwwg',
  'https://www.youtube.com/feeds/videos.xml?channel_id=UCfBvs0ZJdTA43NQrnI9imGA',
  'https://www.youtube.com/feeds/videos.xml?channel_id=UCs9CAWTWvoroM95k7hne8wg',
];

/**
 * YouTube RSS에서 첫 번째 영상 가져오기
 */
const fetchYouTubeVideo = async (rssUrl: string): Promise<YouTubeVideo | null> => {
  try {
    let xmlText: string | null = null;
    
    // 여러 프록시 시도
    for (let i = 0; i < YOUTUBE_PROXIES.length; i++) {
      try {
        const proxyUrl = YOUTUBE_PROXIES[i](rssUrl);
        const response = await Promise.race([
          fetch(proxyUrl, {
            headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' }
          }),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 8000)
          ),
        ]);

        if (response.ok) {
          xmlText = await response.text();
          console.log(`[YouTube RSS] 프록시 ${i + 1}에서 성공적으로 로드됨`);
          break;
        }
      } catch (err) {
        console.warn(`[YouTube RSS] 프록시 ${i + 1} 실패:`, (err as Error).message);
        continue;
      }
    }

    if (!xmlText) {
      throw new Error('모든 프록시에서 실패');
    }

    // XML 파싱
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('XML 파싱 오류');
    }

    const entry = xmlDoc.getElementsByTagName('entry')[0];
    if (!entry) {
      console.warn('[YouTube RSS] entry 요소 없음');
      return null;
    }

    // 제목 추출
    const titleEl = entry.getElementsByTagName('title')[0];
    const title = titleEl?.textContent || '제목 없음';

    // 비디오 ID 추출 (여러 방법 시도)
    let videoId = '';
    
    // 방법 1: 모든 요소를 순회하면서 videoId 찾기
    const allElements = entry.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.localName === 'videoId' || el.tagName.includes('videoId')) {
        videoId = el.textContent || '';
        if (videoId) {
          console.log('[YouTube RSS] videoId (방법1):', videoId);
          break;
        }
      }
    }
    
    // 방법 2: id 요소에서 추출 (yt:video:XXXX 형식)
    if (!videoId) {
      const idEl = entry.getElementsByTagName('id')[0];
      const idText = idEl?.textContent || '';
      const match = idText.match(/yt:video:([a-zA-Z0-9_-]+)/);
      if (match) {
        videoId = match[1];
        console.log('[YouTube RSS] videoId (방법2):', videoId);
      }
    }

    // 방법 3: link href에서 추출
    if (!videoId) {
      const links = entry.getElementsByTagName('link');
      for (let i = 0; i < links.length; i++) {
        const href = links[i].getAttribute('href') || '';
        const match = href.match(/v=([a-zA-Z0-9_-]+)/);
        if (match) {
          videoId = match[1];
          console.log('[YouTube RSS] videoId (방법3):', videoId);
          break;
        }
      }
    }

    if (!videoId) {
      console.warn('[YouTube RSS] videoId를 찾을 수 없음');
      return null;
    }

    // 썸네일 생성
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    // 발행 날짜
    const publishedEl = entry.getElementsByTagName('published')[0];
    const publishedAt = publishedEl?.textContent || new Date().toISOString();

    console.log('[YouTube RSS] ✅ 영상 로드 완료:', {
      videoId,
      title,
      url,
      thumbnail,
    });

    return {
      id: videoId,
      title,
      url,
      thumbnail,
      publishedAt,
    };
  } catch (error) {
    console.error('[YouTube RSS] 오류:', error);
    return null;
  }
};

export const HeroSection = ({ theme }: HeroSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  // YouTube RSS URLs 로드
  useEffect(() => {
    const loadYouTubeVideos = async () => {
      try {
        setLoading(true);
        console.log('[HeroSection] YouTube RSS 로드 시작...');
        
        // 5개 URL에서 동시에 영상 가져오기
        const videoPromises = HERO_YOUTUBE_RSS_URLS.map(url => fetchYouTubeVideo(url));
        const results = await Promise.all(videoPromises);
        
        const loadedVideos = results.filter((video): video is YouTubeVideo => video !== null);
        
        console.log(`[HeroSection] ✅ ${loadedVideos.length}개 영상 로드 완료`);
        setVideos(loadedVideos);
      } catch (error) {
        console.error('[HeroSection] 오류:', error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadYouTubeVideos();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handlePrevVideo = () => {
    setActiveVideoIndex((prev) => (prev > 0 ? prev - 1 : videos.length - 1));
  };

  const handleNextVideo = () => {
    setActiveVideoIndex((prev) => (prev < videos.length - 1 ? prev + 1 : 0));
  };

  const openVideo = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getVideoStyle = (index: number) => {
    const distance = index - activeVideoIndex;
    const absDistance = Math.abs(distance);

    const translateX = distance * 280;
    const opacity = Math.max(0.3, 1 - absDistance * 0.3);
    const blur = absDistance * 3;
    const scale = Math.max(0.7, 1 - absDistance * 0.2);
    const zIndex = 10 - absDistance;

    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      opacity: opacity,
      filter: `blur(${blur}px)`,
      zIndex: zIndex,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-label="Hero section - Portfolio introduction"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 transition-all duration-500"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        role="img"
        aria-label="Portfolio background image"
      >
        {/* Theme-aware overlay gradient */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${theme === 'dark'
            ? 'bg-gradient-to-b from-black/80 via-black/70 to-black/90'
            : 'bg-gradient-to-b from-white/85 via-white/75 to-white/90'
            }`}
          aria-hidden="true"
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center flex flex-col justify-start md:justify-center items-center h-auto md:min-h-screen pt-16 sm:pt-20 md:pt-0">
        {/* Main Title with Icon */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 mb-3 sm:mb-4 animate-fade-in-up w-full">
          <span
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl animate-float"
            role="img"
            aria-label="Portfolio icon"
          >
            ✨
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
            <span
              className={`gradient-text-animated ${theme === 'light' ? 'hero-title-enhanced' : ''}`}
            >
              Give Won Take
            </span>
          </h1>
        </div>

        {/* Korean Subtitle */}
        <div className="max-w-3xl mx-auto mb-6 sm:mb-8 animate-fade-in-delayed w-full px-2">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">
            WON KIM의 포트폴리오 입니다. 반갑습니다.
          </p>
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-row items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 animate-fade-in-up w-full px-2"
          role="group"
          aria-label="Call to action buttons"
        >
          <Button
            className="btn-hero text-xs sm:text-sm md:text-base px-3 sm:px-5 md:px-6 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => scrollToSection('projects')}
            aria-label="View projects section"
          >
            View Projects
          </Button>
          <Button
            className="btn-secondary-hero text-xs sm:text-sm md:text-base px-3 sm:px-5 md:px-6 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => scrollToSection('about')}
            aria-label="View resume and career history"
          >
            View Resume
          </Button>
        </div>

        {/* Icon Badges */}
        <div
          className="flex flex-row items-center justify-center gap-2 mb-6 sm:mb-8 md:mb-16 animate-fade-in-up w-full px-2 flex-wrap"
          role="list"
          aria-label="Portfolio highlights"
        >
          <div
            className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-500 whitespace-nowrap ${theme === 'dark'
              ? 'bg-card/80 border border-border/50 backdrop-blur-sm'
              : 'bg-card/90 border border-border shadow-sm'
              }`}
            role="listitem"
          >
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary animate-pulse" aria-hidden="true" />
            <span className="text-[11px] sm:text-xs font-medium">Creative Portfolio</span>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-500 whitespace-nowrap ${theme === 'dark'
              ? 'bg-card/80 border border-border/50 backdrop-blur-sm'
              : 'bg-card/90 border border-border shadow-sm'
              }`}
            role="listitem"
          >
            <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" aria-hidden="true" />
            <span className="text-[11px] sm:text-xs font-medium">Professional Work</span>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-500 whitespace-nowrap ${theme === 'dark'
              ? 'bg-card/80 border border-border/50 backdrop-blur-sm'
              : 'bg-card/90 border border-border shadow-sm'
              }`}
            role="listitem"
          >
            <Code className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" aria-hidden="true" />
            <span className="text-[11px] sm:text-xs font-medium">Tech Projects</span>
          </div>
        </div>

        {/* YouTube Video Carousel - Positioned above music player on mobile */}
        <div className="w-full mt-12 sm:mt-16 md:mt-0 md:absolute md:bottom-32 lg:bottom-28">
          <div className="relative h-[160px] sm:h-[200px] md:h-[220px] flex items-center justify-center container mx-auto px-2 sm:px-4">
            {/* 영상이 있을 때만 카로셀 표시 */}
            {videos.length > 0 && (
            <>
            {/* Navigation Buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 sm:left-2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-transparent hover:bg-white/10 hover:scale-125 transition-all duration-500"
              onClick={handlePrevVideo}
              aria-label="Previous video"
            >
              <ChevronLeft
                className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                strokeWidth={3}
              />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 sm:right-2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-transparent hover:bg-white/10 hover:scale-125 transition-all duration-500"
              onClick={handleNextVideo}
              aria-label="Next video"
            >
              <ChevronRight
                className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                strokeWidth={3}
              />
            </Button>

            {/* Video Cards */}
            <div className="relative w-full h-full flex items-center justify-center">
              {videos.map((video, index) => {
                const style = getVideoStyle(index);
                const isActive = index === activeVideoIndex;

                return (
                  <div
                    key={video.id}
                    className="absolute cursor-pointer"
                    style={style}
                    onClick={() => setActiveVideoIndex(index)}
                  >
                    <div
                      className={`
                      relative w-[220px] sm:w-[260px] md:w-[280px] h-[124px] sm:h-[146px] md:h-[160px] rounded-lg sm:rounded-xl overflow-hidden
                      transition-all duration-500 shadow-lg hover:shadow-xl
                      ${isActive
                          ? 'ring-2 ring-primary shadow-2xl shadow-primary/40'
                          : 'ring-0 hover:ring-1 hover:ring-primary/50'
                        }
                    `}
                    >
                      <OptimizedImage
                        src={video.thumbnail}
                        alt={`${video.title} thumbnail`}
                        className="w-full h-full object-cover"
                        sizes="280px"
                        widths={[220, 260, 280, 440, 520, 560]}
                        width={280}
                        height={160}
                        aspectRatio="16/9"
                      />

                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openVideo(video.url);
                            }}
                            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all hover:scale-110 shadow-2xl border-2 border-white/40"
                            aria-label={`Play ${video.title}`}
                          >
                            <Play
                              className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ml-1"
                              fill="white"
                            />
                          </button>
                        </div>
                      )}

                      {isActive && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary text-white text-[10px] sm:text-xs font-bold shadow-lg">
                          Now
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gradient Fade Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 md:w-24 bg-gradient-to-r from-black/60 to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 md:w-24 bg-gradient-to-l from-black/60 to-transparent pointer-events-none z-10" />
            </>
            )}
          </div>

          {/* Dots Indicator */}
          <div
            className="flex justify-center gap-px mt-2"
            role="tablist"
            aria-label="Video selection"
          >
            {videos.map((video, index) => (
              <button
                key={video.id}
                onClick={() => setActiveVideoIndex(index)}
                className="rounded-full transition-all duration-300"
                aria-label={`Go to video ${index + 1}`}
                aria-selected={index === activeVideoIndex}
                role="tab"
              >
                <span
                  className={`
                    block rounded-full transition-all duration-300
                    ${index === activeVideoIndex ? 'w-2 h-2 bg-primary' : 'w-1.5 h-1.5 bg-white/40'}
                  `}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
