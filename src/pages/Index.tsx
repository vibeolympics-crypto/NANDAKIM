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

// Notion Blog API를 통한 블로그 피드 (Cloudflare Worker)
// RSS는 fallback으로만 사용됨

const Index = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    locationName: 'Seoul, South Korea',
    coordinates: { lat: 37.5665, lng: 126.978 },
    zoom: 15,
    provider: 'google',
  });

  // Notion Blog Feed 호출 (첫 번째 파라미터는 하위 호환성 용도로 무시됨)
  const { posts: rssPosts, loading: rssBlogLoading, error: rssBlogError } = useRssFeed('', 10);

  // 블로그 포스트 사용
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
