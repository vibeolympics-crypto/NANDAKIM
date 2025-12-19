import { useState, useMemo, useEffect, useCallback } from 'react';
import { ExternalLink, Calendar, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { useAIVibeNewsFeed } from '@/hooks/useAIVibeNewsFeed';
import { NewsItem } from '@/lib/api';

// 소스별 색상 맵 (국내 AI/IT/코딩 뉴스)
const SOURCE_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  'AI타임스': { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  'ZDNet Korea': { bg: 'bg-cyan-500/10', text: 'text-cyan-600' },
  '블로터': { bg: 'bg-purple-500/10', text: 'text-purple-600' },
};

// 카테고리별 색상 맵
const CATEGORY_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  'AI': { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  'VIBE': { bg: 'bg-purple-500/10', text: 'text-purple-600' },
  'AI & VIBE': { bg: 'bg-pink-500/10', text: 'text-pink-600' },
  'VIBE Coding': { bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
};

// 총 뉴스 개수 제한 (3x3 그리드 = 9개)
const TOTAL_NEWS_LIMIT = 9;

export function AIVibeNewsSection() {
  // 📝 RSS 피드에서 뉴스 로드 (안정성: RSS 실패 시 로컬 JSON 사용)
  // 3개 소스 x 3개 = 9개 뉴스 표시
  const { news: rsNews, loading, error, lastUpdated } = useAIVibeNewsFeed(3);
  
  // Fallback: RSS 없으면 로컬 JSON 로드
  const [localNews, setLocalNews] = useState<NewsItem[]>([]);
  const [localLoading, setLocalLoading] = useState(!rsNews || rsNews.length === 0);

  useEffect(() => {
    // RSS 뉴스가 있으면 로컬 데이터 로드 스킵
    if (rsNews && rsNews.length > 0) {
      setLocalLoading(false);
      return;
    }

    // RSS 로드 실패 시 로컬 JSON 로드 (loading = false일 때만 실행)
    if (!loading && rsNews && rsNews.length === 0) {
      const loadLocalNews = async () => {
        try {
          console.log('[뉴스] 로컬 JSON 로드 시작...');
          const response = await fetch('/ai-vibe-news.json');
          if (response.ok) {
            const data = await response.json();
            console.log(`[뉴스] ✅ 로컬 JSON 로드 성공: ${data.news?.length || 0}개`, data);
            setLocalNews(data.news || []);
          } else {
            console.warn('[뉴스] 로컬 JSON 로드 실패 (HTTP):', response.status, response.statusText);
          }
        } catch (err) {
          console.warn('[뉴스] 로컬 데이터 로드 실패:', err);
        } finally {
          setLocalLoading(false);
        }
      };

      loadLocalNews();
    }
  }, [rsNews, loading]);

  // 최종 뉴스 데이터 (RSS 우선, 실패 시 로컬)
  const news = (rsNews && rsNews.length > 0) ? rsNews : localNews;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 새로고침 핸들러
  const handleRefreshClick = useCallback(async () => {
    if (!isRefreshing) {
      setIsRefreshing(true);
      // 약간의 시간 후 새로고침 완료 표시
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [isRefreshing]);

  // 카테고리별 필터링
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    news.forEach(post => {
      if (post.category) {
        post.category.split(' & ').forEach(cat => categorySet.add(cat.trim()));
      }
    });
    return Array.from(categorySet).sort();
  }, [news]);

  const filteredPosts = useMemo(() => {
    let posts = news;
    if (selectedCategory !== 'all') {
      posts = news.filter(post =>
        post.category.includes(selectedCategory)
      );
    }
    // 9개로 제한 (3x3 그리드)
    return posts.slice(0, TOTAL_NEWS_LIMIT);
  }, [news, selectedCategory]);

  // 로딩 상태 (초기 로딩 중)
  const isInitialLoading = loading && localLoading && news.length === 0;
  
  if (isInitialLoading) {
    return (
      <section id="ai-vibe-news" className="w-full py-10 md:py-14 px-4 bg-background" aria-labelledby="news-heading">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12">
            <h2 id="news-heading" className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
              <span className="gradient-text-animated">AI & VIBE News</span>
            </h2>
          </header>

          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-muted-foreground">뉴스 로딩 중...</p>
          </div>
        </div>
      </section>
    );
  }

  // 에러 상태
  if (error && news.length === 0) {
    return (
      <section id="ai-vibe-news" className="w-full py-10 md:py-14 px-4 bg-background" aria-labelledby="news-heading">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12">
            <h2 id="news-heading" className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
              <span className="gradient-text-animated">AI & VIBE News</span>
            </h2>
          </header>

          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
            <p className="text-muted-foreground text-center max-w-md">{error}</p>
            <button
              onClick={handleRefreshClick}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 메인 렌더링
  return (
    <section id="ai-vibe-news" className="w-full py-10 md:py-14 px-4 bg-background" aria-labelledby="news-heading">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <header className="text-center mb-12">
          <h2 id="news-heading" className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
            <span className="gradient-text-animated">AI & VIBE News</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            AI & VIBE 코딩 관련 뉴스 입니다.
          </p>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6 md:mb-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 md:px-6 py-2 rounded-full font-semibold text-sm transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              aria-pressed={selectedCategory === 'all'}
            >
              All News ({news.length})
            </button>

            {categories.map((category) => {
              const count = news.filter(p => p.category.includes(category)).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 md:px-6 py-2 rounded-full font-semibold text-sm transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  aria-pressed={selectedCategory === category}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>

          {/* 마지막 업데이트 및 새로고침 */}
          {lastUpdated && (
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <span className="text-xs md:text-sm text-muted-foreground">
                마지막 업데이트: <span className="font-semibold text-primary">{lastUpdated.toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </span>
              <button
                onClick={handleRefreshClick}
                disabled={isRefreshing || loading}
                className="text-primary hover:text-primary/70 transition-colors disabled:opacity-50"
                aria-label="새로고침"
                title="뉴스 피드 새로고침"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing || loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
            </div>
          )}
        </header>

        {/* 뉴스 그리드 */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">뉴스가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="feed" aria-label="뉴스 피드">
            {filteredPosts.map((post) => {
              const sourceColor = SOURCE_COLOR_MAP[post.source] || { bg: 'bg-gray-500/10', text: 'text-gray-600' };
              const categoryColor = CATEGORY_COLOR_MAP[post.category] || { bg: 'bg-gray-500/10', text: 'text-gray-600' };

              return (
                <article
                  key={post.id}
                  className="bg-card rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col group cursor-pointer"
                  onClick={() => window.open(post.url, '_blank', 'noopener,noreferrer')}
                  role="article"
                  aria-label={post.title}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      window.open(post.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  {/* 이미지 */}
                  <div className="relative h-48 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.log(`[썸네일] ✅ 로드 성공`, {
                          source: post.source,
                          title: post.title.substring(0, 40),
                          url: post.image.substring(0, 80),
                          size: `${target.naturalWidth}x${target.naturalHeight}px`,
                        });
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error(`[썸네일] ❌ 로드 실패`, {
                          source: post.source,
                          title: post.title.substring(0, 50),
                          imageUrl: post.image.substring(0, 100),
                          errorEvent: e.type,
                        });
                        // 이미지 로드 실패 시 원본 이미지 숨기기
                        target.style.display = 'none';
                        // Fallback 배경 표시
                        const fallback = target.parentElement?.querySelector('[data-fallback-bg]') as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                          fallback.style.opacity = '1';
                        }
                      }}
                    />
                    {/* 이미지 로드 실패 시 Fallback 배경 */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-purple-600/80 to-pink-600/70 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 group-hover:shadow-inner"
                      data-fallback-bg
                      role="img"
                      aria-label={`${post.source} 뉴스 이미지`}
                      onMouseEnter={() => {
                        console.log('[Fallback] 사용 중:', {
                          source: post.source,
                          reason: '이미지 로드 실패',
                        });
                      }}
                    >
                      {/* 배경 패턴 */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-2 left-2 w-20 h-20 bg-white rounded-full blur-xl"></div>
                        <div className="absolute bottom-2 right-2 w-24 h-24 bg-white rounded-full blur-2xl"></div>
                      </div>
                      
                      {/* 콘텐츠 */}
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="text-6xl font-black text-white mb-3 drop-shadow-lg">
                          {post.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-xs text-white/90 font-bold text-center px-3 drop-shadow-md max-w-24 line-clamp-2">
                          {post.category}
                        </div>
                        <div className="text-7xl mt-2 opacity-20">
                          📰
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 콘텐츠 */}
                  <div className="p-5 flex flex-col flex-grow">
                    {/* 소스 및 카테고리 배지 */}
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${sourceColor.bg} ${sourceColor.text}`}>
                        {post.source}
                      </span>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${categoryColor.bg} ${categoryColor.text}`}>
                        {post.category}
                      </span>
                    </div>

                    {/* 제목 */}
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>

                    {/* 요약 */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                      {post.summary}
                    </p>

                    {/* 푸터 - 날짜와 링크 */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </time>
                      </div>
                      <div className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all text-sm font-semibold">
                        <span className="hidden sm:inline">Read</span>
                        <ExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

