import { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { WelcomeMessage } from '@/components/WelcomeMessage';
import { AnimatedSection } from '@/components/AnimatedSection';
import { MapSection } from '@/components/MapSection';
import blogData from '@/data/blog.json';
import { useRssFeed } from '@/hooks/useRssFeed';
import {
  AboutSectionSkeleton,
  FeaturedProjectsSkeleton,
  ContactFormSkeleton,
  MapSectionSkeleton,
  GenericContentSkeleton,
} from '@/components/SkeletonUI';

// Code splitting: Lazy load below-the-fold components
const AboutSection = lazy(() =>
  import('@/components/AboutSection').then((module) => ({ default: module.AboutSection }))
);
const FeaturedHighlights = lazy(() =>
  import('@/components/FeaturedHighlights').then((module) => ({
    default: module.FeaturedHighlights,
  }))
);
const BlogSNSSection = lazy(() =>
  import('@/components/BlogSNSSection').then((module) => ({ default: module.BlogSNSSection }))
);
const ContactSection = lazy(() =>
  import('@/components/ContactSection').then((module) => ({ default: module.ContactSection }))
);
const Footer = lazy(() =>
  import('@/components/Footer').then((module) => ({ default: module.Footer }))

);
const AIVibeNewsSection = lazy(() =>
  import('@/components/AIVibeNewsSection').then((module) => ({ default: module.AIVibeNewsSection }))
);

interface MapSettings {
  apiKey: string;
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  zoom: number;
  provider: 'google' | 'kakao';
}

// 네이버 블로그 RSS URL - 환경 변수에서 로드 (폴백: 빈 문자열)
const NAVER_BLOG_RSS_URL = import.meta.env.VITE_BLOG_RSS_URL || '';

const Index = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    locationName: 'Seoul, South Korea',
    coordinates: { lat: 37.5665, lng: 126.978 },
    zoom: 15,
    provider: 'google',
  });

  // RSS 피드 호출 - 안정성 개선: 오류 시에도 블로그 데이터는 표시됨
  const { posts: rssPosts, loading: rssBlogLoading, error: rssBlogError } = useRssFeed(NAVER_BLOG_RSS_URL, 10);

  // RSS 피드가 있으면 RSS 데이터, 없으면 로컬 블로그 데이터 사용
  const combinedBlogPosts = rssPosts.length > 0 ? rssPosts : blogData.posts || [];

  return (
    <div className="min-h-screen font-['Roboto']">
      <Header onThemeChange={setTheme} />
      <main id="main-content" tabIndex={-1} className="space-y-0 focus:outline-none">
        {/* Hero Section */}
        <HeroSection theme={theme} />

        {/* Welcome Message Section - Google AdSense Area */}
        <section className="py-4 md:py-6">
          <WelcomeMessage location="South Korea" />
        </section>

        {/* About Section */}
        <Suspense fallback={<AboutSectionSkeleton />}>
          <section id="about" className="pt-8 pb-6">
            <AnimatedSection animation="slide-up" duration={800}>
              <AboutSection />
            </AnimatedSection>
          </section>
        </Suspense>

        {/* Featured Projects Section - 6 Cards */}
        <Suspense fallback={<FeaturedProjectsSkeleton />}>
          <section id="projects" className="pt-8 pb-6">
            <AnimatedSection animation="slide-left" duration={800}>
              <FeaturedHighlights />
            </AnimatedSection>
          </section>
        </Suspense>

        {/* Blog & SNS Feed Section */}
        <Suspense fallback={<GenericContentSkeleton height="600px" />}>
          <section id="blog" className="pt-8 pb-6">
            <AnimatedSection animation="slide-right" duration={800}>
              <BlogSNSSection
                blogPosts={combinedBlogPosts}
                youtubeChannelId={import.meta.env.VITE_BLOG_YOUTUBE_CHANNEL || 'UC8butISFMNMtqOD0DXl5-dA'}
                isLoadingBlog={rssBlogLoading}
                blogError={rssBlogError}
              />
            </AnimatedSection>
          </section>
        </Suspense>

        {/* AI & VIBE News Section */}
        <Suspense fallback={<GenericContentSkeleton height="600px" />}>
          <section id="ai-vibe-news" className="pt-8 pb-6">
            <AnimatedSection animation="slide-left" duration={800}>
              <AIVibeNewsSection />
            </AnimatedSection>
          </section>
        </Suspense>

        <Suspense fallback={<ContactFormSkeleton />}>
          {/* Contact Section */}
          <section id="contact" className="pt-8 pb-6">
            <AnimatedSection animation="converge" duration={1000}>
              <ContactSection />
            </AnimatedSection>
          </section>
        </Suspense>

        <Suspense fallback={<MapSectionSkeleton />}>
          {/* Map Section */}
          <section id="map" className="pt-8 pb-6">
            <AnimatedSection animation="fade-in" duration={800}>
              <MapSection
                provider={mapSettings.provider}
                apiKey={mapSettings.apiKey}
                coordinates={mapSettings.coordinates}
                zoom={mapSettings.zoom}
                address={mapSettings.locationName}
              />
            </AnimatedSection>
          </section>
        </Suspense>

        {/* Bottom AdSense Area - Before Footer */}
        <section className="py-4 md:py-6">
          <WelcomeMessage location="Global" />
        </section>
      </main>

      {/* Footer */}
      <Suspense fallback={<GenericContentSkeleton height="300px" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
