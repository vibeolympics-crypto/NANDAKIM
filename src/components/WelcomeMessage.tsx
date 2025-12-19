import { useEffect, useRef } from 'react';

// AdSense temporarily disabled per user request
const ADSENSE_ENABLED = false;

interface WelcomeMessageProps {
  location?: string;
  badges?: string[];
}

export const WelcomeMessage = ({ location = 'South Korea', badges }: WelcomeMessageProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ADSENSE_ENABLED) {
      return;
    }
    // Google AdSense 스크립트가 로드되면 광고를 표시합니다
    // 실제 AdSense 코드는 사용자가 직접 설정해야 합니다
    if (adContainerRef.current && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, []);

  if (!ADSENSE_ENABLED) {
    return null;
  }

  return (
    <section className="py-8" aria-label="Advertisement section">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-muted/30 border border-border rounded-2xl p-6 md:p-8 animate-fade-in">
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-sm text-muted-foreground mb-2">Welcome from {location}!</h3>

              {/* Google AdSense 광고 영역 */}
              <div
                ref={adContainerRef}
                className="w-full min-h-[250px] flex items-center justify-center bg-background/50 rounded-lg border border-dashed border-border"
              >
                <div className="text-center p-8">
                  <p className="text-muted-foreground text-sm">Google AdSense 광고 영역</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    실제 AdSense 코드를 삽입하세요
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// TypeScript 타입 선언
// Google AdSense type declaration
declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}
