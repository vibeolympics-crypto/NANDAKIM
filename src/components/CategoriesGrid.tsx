import { useState, useRef } from 'react';
import { Calendar, Heart, Eye, Sparkles, Cpu, Brain, Zap } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

export const CategoriesGrid = () => {
  const [cardPositions, setCardPositions] = useState<{ [key: number]: { x: number; y: number } }>(
    {}
  );
  const [draggingCard, setDraggingCard] = useState<number | null>(null);
  const dragStartPos = useRef<{ x: number; y: number; cardX: number; cardY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Digital/AI/Future themed images
  const digitalImages = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1676277791608-ac52e1936d5e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1676299081847-824916de030a?w=400&h=300&fit=crop',
  ];

  // Combined posts for W-shape layout (13 cards for complete W)
  const allPosts = [
    {
      id: 1,
      type: 'blog',
      title: 'AI 시대의 웹 개발',
      excerpt: 'ChatGPT와 함께하는 차세대 개발 경험',
      thumbnail: digitalImages[0],
      date: '2024.01.15',
      views: '1.2K',
      category: 'AI',
      icon: Brain,
    },
    {
      id: 2,
      type: 'sns',
      platform: 'Twitter',
      content: '🚀 새로운 AI 프로젝트 시작! 실시간 협업 도구 개발 중',
      thumbnail: digitalImages[1],
      timestamp: '2시간 전',
      likes: 245,
      icon: Sparkles,
    },
    {
      id: 3,
      type: 'blog',
      title: '양자 컴퓨팅의 미래',
      excerpt: '차세대 컴퓨팅 기술이 가져올 변화',
      thumbnail: digitalImages[2],
      date: '2024.01.10',
      views: '2.5K',
      category: 'Future Tech',
      icon: Cpu,
    },
    {
      id: 4,
      type: 'sns',
      platform: 'Threads',
      content: '💡 AI와 웹 개발의 융합: 스마트 코드 어시스턴트 개발기 (Threads)',
      thumbnail: digitalImages[3],
      timestamp: '5시간 전',
      likes: 389,
      icon: Brain,
    },
    {
      id: 5,
      type: 'blog',
      title: '메타버스 개발 가이드',
      excerpt: 'Three.js와 WebXR로 구축하는 가상 세계',
      thumbnail: digitalImages[4],
      date: '2024.01.05',
      views: '3.1K',
      category: 'Metaverse',
      icon: Zap,
    },
    {
      id: 6,
      type: 'sns',
      platform: 'Instagram',
      content: '🌐 디지털 미래를 만드는 개발자의 일상 #AI #WebDev',
      thumbnail: digitalImages[5],
      timestamp: '1일 전',
      likes: 512,
      icon: Sparkles,
    },
    {
      id: 7,
      type: 'blog',
      title: '블록체인과 Web3',
      excerpt: '탈중앙화 웹의 새로운 패러다임',
      thumbnail: digitalImages[6],
      date: '2023.12.28',
      views: '1.8K',
      category: 'Blockchain',
      icon: Cpu,
    },
    {
      id: 8,
      type: 'sns',
      platform: 'YouTube',
      content: '🎥 신규 영상: "AI 개발자 로드맵 2024" 업로드!',
      thumbnail: digitalImages[7],
      timestamp: '2일 전',
      likes: 1240,
      icon: Zap,
    },
    {
      id: 9,
      type: 'blog',
      title: '5G와 엣지 컴퓨팅',
      excerpt: '초저지연 네트워크가 만드는 새로운 가능성',
      thumbnail: digitalImages[0],
      date: '2023.12.20',
      views: '980',
      category: 'Network',
      icon: Cpu,
    },
    {
      id: 10,
      type: 'sns',
      platform: 'Twitter',
      content: '⚡ 실시간 데이터 처리의 미래를 논의하는 컨퍼런스 참석!',
      thumbnail: digitalImages[1],
      timestamp: '3일 전',
      likes: 678,
      icon: Sparkles,
    },
    {
      id: 11,
      type: 'blog',
      title: '신경망 아키텍처',
      excerpt: 'Transformer부터 최신 모델까지',
      thumbnail: digitalImages[2],
      date: '2023.12.15',
      views: '2.1K',
      category: 'Deep Learning',
      icon: Brain,
    },
    {
      id: 12,
      type: 'sns',
      platform: 'Threads',
      content: '🎯 머신러닝 프로젝트 성공 사례 공유 (Threads)',
      thumbnail: digitalImages[3],
      timestamp: '4일 전',
      likes: 892,
      icon: Zap,
    },
    {
      id: 13,
      type: 'blog',
      title: '디지털 트윈 기술',
      excerpt: '가상과 현실을 연결하는 혁신',
      thumbnail: digitalImages[4],
      date: '2023.12.10',
      views: '1.5K',
      category: 'IoT',
      icon: Cpu,
    },
  ];

  return (
    <div className="relative">
      {/* Header */}
      <div className="text-center mb-16 animate-fade-in-up">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
          <span className="gradient-text-animated">블로그 & SNS 피드</span>
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          디지털 세계에서 펼쳐지는 최신 기술 이야기
        </p>
      </div>

      {/* Digital Globe Container */}
      <div className="relative min-h-[1000px] flex items-center justify-center overflow-visible px-4">
        {/* Wireframe Globe Background - Centered */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full max-w-6xl mx-auto h-full flex items-center justify-center">
            {/* Glowing gradient background */}
            <div
              className="absolute w-[700px] h-[700px] rounded-full opacity-15"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.5), rgba(147, 51, 234, 0.4), rgba(236, 72, 153, 0.3), transparent 70%)',
                filter: 'blur(60px)',
                animation: 'pulse 8s ease-in-out infinite',
              }}
            />

            {/* Wireframe Globe SVG */}
            <svg
              className="absolute w-[600px] h-[600px] opacity-30"
              viewBox="0 0 600 600"
              style={{ animation: 'spin 60s linear infinite' }}
            >
              {/* Latitude lines */}
              <ellipse
                cx="300"
                cy="300"
                rx="280"
                ry="280"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <ellipse
                cx="300"
                cy="300"
                rx="280"
                ry="220"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="1"
                opacity="0.5"
              />
              <ellipse
                cx="300"
                cy="300"
                rx="280"
                ry="160"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="1"
                opacity="0.4"
              />
              <ellipse
                cx="300"
                cy="300"
                rx="280"
                ry="100"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="1"
                opacity="0.3"
              />
              <ellipse
                cx="300"
                cy="300"
                rx="280"
                ry="50"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="0.5"
                opacity="0.2"
              />

              {/* Longitude lines */}
              <ellipse
                cx="300"
                cy="300"
                rx="280"
                ry="280"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <ellipse
                cx="300"
                cy="300"
                rx="220"
                ry="280"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="1"
                opacity="0.5"
              />
              <ellipse
                cx="300"
                cy="300"
                rx="160"
                ry="280"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="1"
                opacity="0.4"
              />
              <ellipse
                cx="300"
                cy="300"
                rx="100"
                ry="280"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="1"
                opacity="0.3"
              />
              <ellipse
                cx="300"
                cy="300"
                rx="50"
                ry="280"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="0.5"
                opacity="0.2"
              />

              {/* Network connection lines */}
              <line
                x1="150"
                y1="150"
                x2="450"
                y2="450"
                stroke="url(#gradient3)"
                strokeWidth="0.5"
                opacity="0.3"
                strokeDasharray="5,5"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="10"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </line>
              <line
                x1="450"
                y1="150"
                x2="150"
                y2="450"
                stroke="url(#gradient3)"
                strokeWidth="0.5"
                opacity="0.3"
                strokeDasharray="5,5"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="10"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </line>
              <line
                x1="300"
                y1="50"
                x2="300"
                y2="550"
                stroke="url(#gradient3)"
                strokeWidth="0.5"
                opacity="0.2"
                strokeDasharray="3,3"
              />
              <line
                x1="50"
                y1="300"
                x2="550"
                y2="300"
                stroke="url(#gradient3)"
                strokeWidth="0.5"
                opacity="0.2"
                strokeDasharray="3,3"
              />

              {/* Glowing nodes */}
              <circle cx="300" cy="80" r="3" fill="#3b82f6" opacity="0.8">
                <animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="480" cy="300" r="3" fill="#9333ea" opacity="0.8">
                <animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="300" cy="520" r="3" fill="#ec4899" opacity="0.8">
                <animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="3.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="120" cy="300" r="3" fill="#3b82f6" opacity="0.8">
                <animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Gradient definitions */}
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#9333ea" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#9333ea" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Particle effects */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-primary rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: 0.3 + Math.random() * 0.4,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Floating Cards - Wide Scattered Formation with Drag & Drop */}
        <div
          ref={containerRef}
          className="relative w-full max-w-7xl mx-auto flex items-center justify-center"
          role="list"
        >
          {allPosts.map((post, index) => {
            // Wide scattered positions around center (13 cards)
            const scatteredPositions = [
              { x: -520, y: -120 },
              { x: 480, y: -150 },
              { x: -280, y: 140 },
              { x: 550, y: 80 },
              { x: -600, y: 40 },
              { x: 220, y: -180 },
              { x: -80, y: -200 },
              { x: 380, y: 160 },
              { x: -450, y: -60 },
              { x: 120, y: 180 },
              { x: -350, y: -140 },
              { x: 500, y: -40 },
              { x: -150, y: 100 },
            ];

            const defaultPosition = scatteredPositions[index] || { x: 0, y: 0 };
            const position = cardPositions[index] || defaultPosition;

            const handleMouseDown = (e: React.MouseEvent) => {
              e.preventDefault();
              setDraggingCard(index);
              dragStartPos.current = {
                x: e.clientX,
                y: e.clientY,
                cardX: position.x,
                cardY: position.y,
              };
            };

            const handleMouseMove = (e: MouseEvent) => {
              if (draggingCard === index && dragStartPos.current) {
                const deltaX = e.clientX - dragStartPos.current.x;
                const deltaY = e.clientY - dragStartPos.current.y;

                setCardPositions((prev) => ({
                  ...prev,
                  [index]: {
                    x: dragStartPos.current!.cardX + deltaX,
                    y: dragStartPos.current!.cardY + deltaY,
                  },
                }));
              }
            };

            const handleMouseUp = () => {
              setDraggingCard(null);
              dragStartPos.current = null;
            };

            // Add global mouse event listeners
            if (draggingCard === index) {
              window.addEventListener('mousemove', handleMouseMove);
              window.addEventListener('mouseup', handleMouseUp);

              // Cleanup
              setTimeout(() => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
              }, 0);
            }

            // Random rotations for sticky note effect
            const rotations = [
              '-rotate-2',
              'rotate-1',
              '-rotate-3',
              'rotate-2',
              '-rotate-1',
              'rotate-3',
              '-rotate-2',
              'rotate-1',
              '-rotate-3',
              'rotate-2',
              '-rotate-1',
              'rotate-2',
            ];
            const rotation = rotations[index];

            // Varying sizes
            const sizes = [
              'w-48',
              'w-52',
              'w-56',
              'w-48',
              'w-52',
              'w-56',
              'w-48',
              'w-52',
              'w-56',
              'w-48',
              'w-52',
              'w-56',
            ];
            const size = sizes[index];

            const Icon = post.icon;

            return (
              <article
                key={post.id}
                className={`absolute ${size} ${rotation} group hover:z-50 ${draggingCard === index ? 'cursor-grabbing z-50' : 'cursor-grab'}`}
                style={{
                  left: `calc(50% + ${position.x}px)`,
                  top: `calc(50% + ${position.y}px)`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${index * 150}ms`,
                  animation:
                    draggingCard === index
                      ? 'none'
                      : `float ${4 + (index % 3)}s ease-in-out infinite, fade-in-up 0.6s ease-out ${index * 150}ms both`,
                  transition: draggingCard === index ? 'none' : 'all 0.3s ease-out',
                  userSelect: 'none',
                }}
                onMouseDown={handleMouseDown}
                role="listitem"
              >
                <div
                  className="relative bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm rounded-2xl overflow-hidden border-2 border-primary/20 hover:border-primary transition-all duration-700 hover:shadow-2xl hover:shadow-primary/20 hover:scale-110 hover:rotate-0 group-hover:z-50"
                  style={{
                    animation: `breathe ${5 + (index % 4)}s ease-in-out infinite`,
                    animationDelay: `${index * 0.3}s`,
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-32 overflow-hidden">
                    <OptimizedImage
                      src={post.thumbnail}
                      alt={post.type === 'blog' ? post.title : post.content}
                      width={400}
                      height={300}
                      aspectRatio="4/3"
                      sizes="(max-width: 768px) 100vw, 400px"
                      widths={[400, 800]}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Icon Badge */}
                    <div className="absolute top-2 left-2">
                      <div className="w-8 h-8 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    {/* Category/Platform Badge */}
                    <div className="absolute top-2 right-2">
                      <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                        {post.type === 'blog' ? post.category : post.platform}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    {post.type === 'blog' ? (
                      <>
                        <h4 className="text-sm font-bold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-foreground mb-2 line-clamp-3">{post.content}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{post.timestamp}</span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
