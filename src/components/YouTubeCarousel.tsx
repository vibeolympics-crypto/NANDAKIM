import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from './ui/button';
import { OptimizedImage } from './OptimizedImage';

interface YouTubeVideo {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
}

export const YouTubeCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(2); // Start from 3rd video (index 2)

  const videos: YouTubeVideo[] = [
    {
      id: '-8JTwRH23VY',
      url: 'https://youtu.be/-8JTwRH23VY?si=PkmHQ1XYsYxQ5bF9',
      title: '아이폰 16 프로 맥스 언박싱 & 첫인상 리뷰',
      thumbnail: 'https://img.youtube.com/vi/-8JTwRH23VY/maxresdefault.jpg',
    },
    {
      id: 'xhW9up0Gi2E',
      url: 'https://youtu.be/xhW9up0Gi2E?si=dtyOPRkIQTRKuc_q',
      title: '갤럭시 Z 폴드6 vs 아이폰 15 프로 맥스 비교',
      thumbnail: 'https://img.youtube.com/vi/xhW9up0Gi2E/maxresdefault.jpg',
    },
    {
      id: 'iL6OR79RE7Y',
      url: 'https://youtu.be/iL6OR79RE7Y?si=f8iQAzUauc1GYy0F',
      title: '2024 최고의 스마트폰 TOP 10',
      thumbnail: 'https://img.youtube.com/vi/iL6OR79RE7Y/maxresdefault.jpg',
    },
    {
      id: 'a3VkXTzlYnU',
      url: 'https://youtu.be/a3VkXTzlYnU?si=s2hMEDO06MTYdpKS',
      title: 'MacBook Pro M3 완벽 리뷰',
      thumbnail: 'https://img.youtube.com/vi/a3VkXTzlYnU/maxresdefault.jpg',
    },
    {
      id: 'LcMDcwU7FVw',
      url: 'https://youtu.be/LcMDcwU7FVw?si=EZQVwJkO4wkpLArA',
      title: 'AI 시대의 개발자 되기',
      thumbnail: 'https://img.youtube.com/vi/LcMDcwU7FVw/maxresdefault.jpg',
    },
    {
      id: 'lelVripbt2M',
      url: 'https://youtu.be/lelVripbt2M?si=1TjlwnU9zUuQNtjE',
      title: 'React 19 새로운 기능 총정리',
      thumbnail: 'https://img.youtube.com/vi/lelVripbt2M/maxresdefault.jpg',
    },
  ];

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : videos.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < videos.length - 1 ? prev + 1 : 0));
  };

  const handleVideoClick = (index: number) => {
    setActiveIndex(index);
  };

  const openVideo = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Calculate position and styling for each video based on distance from center
  const getVideoStyle = (index: number) => {
    const distance = index - activeIndex;
    const absDistance = Math.abs(distance);

    // Calculate curve position (semi-circle arc)
    const angle = distance * 12; // degrees
    const radius = 100; // pixels for vertical displacement
    const translateY = radius - radius * Math.cos((angle * Math.PI) / 180);
    const translateX = distance * 350; // horizontal spacing for thumbnail-only cards

    // Calculate opacity and blur based on distance
    const opacity = Math.max(0.3, 1 - absDistance * 0.25);
    const blur = absDistance * 2;
    const scale = Math.max(0.75, 1 - absDistance * 0.15);
    const zIndex = 10 - absDistance;

    return {
      transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
      opacity: opacity,
      filter: `blur(${blur}px)`,
      zIndex: zIndex,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  return (
    <section
      id="youtube-carousel"
      className="relative py-12 bg-gradient-to-b from-muted/30 to-background overflow-hidden"
      aria-label="YouTube video carousel"
    >
      <div className="container mx-auto px-4">
        {/* Carousel Container */}
        <div className="relative h-[400px] flex items-center justify-center">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 md:left-8 z-20 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:scale-110 transition-all duration-500 shadow-lg"
            onClick={handlePrevious}
            aria-label="Previous video"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 md:right-8 z-20 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:scale-110 transition-all duration-500 shadow-lg"
            onClick={handleNext}
            aria-label="Next video"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Video Cards */}
          <div className="relative w-full h-full flex items-center justify-center">
            {videos.map((video, index) => {
              const style = getVideoStyle(index);
              const isActive = index === activeIndex;

              return (
                <div
                  key={video.id}
                  className="absolute cursor-pointer group"
                  style={style}
                  onClick={() => handleVideoClick(index)}
                >
                  <div
                    className={`
                      relative w-[320px] h-[180px] rounded-xl overflow-hidden
                      border-2 transition-all duration-500
                      ${
                        isActive
                          ? 'border-primary shadow-2xl shadow-primary/30'
                          : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    {/* Thumbnail - fills entire card */}
                    <OptimizedImage
                      src={video.thumbnail}
                      alt={`${video.title} thumbnail`}
                      width={320}
                      height={180}
                      aspectRatio="16/9"
                      sizes="320px"
                      widths={[320, 640]}
                    />

                    {/* Play Button Overlay */}
                    <div
                      className={`
                        absolute inset-0 flex items-center justify-center
                        bg-black/40 transition-opacity duration-500
                        ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                      `}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openVideo(video.url);
                        }}
                        className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
                        aria-label={`Play ${video.title}`}
                      >
                        <Play className="h-8 w-8 text-white ml-1" fill="white" />
                      </button>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold">
                        Selected
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gradient Fade Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none z-10" />
        </div>

        {/* Dots Indicator */}
        <div
          className="flex justify-center gap-px mt-8"
          role="tablist"
          aria-label="Video selection"
        >
          {videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => setActiveIndex(index)}
              className={`
                rounded-full transition-all duration-300
                ${index === activeIndex ? 'scale-100' : 'scale-90 hover:scale-100'}
              `}
              aria-label={`Go to video ${index + 1}`}
              aria-selected={index === activeIndex}
              role="tab"
            >
              <span
                className={`
                  block rounded-full transition-all duration-300
                  ${
                    index === activeIndex
                      ? 'w-2 h-2 bg-primary'
                      : 'w-1.5 h-1.5 bg-muted-foreground/50'
                  }
                `}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
