import { useState, useEffect } from 'react';
import { Zap, Brain, TrendingUp, GraduationCap, Briefcase, Award, Users, LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

// Type definitions
interface Certification {
  id?: string;
  name: string;
  issuer?: string;
  date?: string;
}

interface CareerTimelineItem {
  icon?: string;
  year: string;
  title: string;
  description: string;
  type?: string;
}

interface AboutData {
  name?: string;
  title?: string;
  biography?: string;
  profileImage?: string;
  certifications?: (Certification | string)[];
  careerTimeline?: CareerTimelineItem[];
}

const iconMap: Record<string, LucideIcon> = {
  GraduationCap,
  Briefcase,
  Award,
  Users,
};

export const AboutSection = () => {
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await fetch('/api/content/about');
        if (response.ok) {
          const data = await response.json();
          setAboutData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch about data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAboutData();
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

  const features = [
    {
      icon: Zap,
      title: '빠른 실행력',
      description: '아이디어를 즉시 프로토타입으로 전환하여 빠르게 검증',
      color: 'text-accent',
    },
    {
      icon: Brain,
      title: 'AI 활용',
      description: '최신 AI 도구를 활용하여 개발 속도와 품질을 극대화',
      color: 'text-primary',
    },
    {
      icon: TrendingUp,
      title: '비즈니스 감각',
      description: '기술과 비즈니스를 연결하여 실질적인 가치를 창출',
      color: 'text-secondary',
    },
  ];

  // Default fallback data
  const defaultQualifications = [
    'ESG 전문가',
    'ESG 경영평가사',
    'ESG 인증평가사',
    'ESG 경영지도자 Lv.Ⅱ',
    '정보보안전문가',
    '프롬프트엔지니어',
    '전자계산기기능사',
    '운전면허: 1종보통',
    '병역: 육군병장전역',
    '그 외 자격: 지게차(2.5t),멀티콥터 4종',
  ];

  const defaultTimeline = [
    {
      icon: GraduationCap,
      year: '2025',
      title: '한국과학기술정보연구원',
      description: '기업 ESG 대응전략, K-ESG 가이드라인',
      type: 'education',
    },
    {
      icon: GraduationCap,
      year: '2025',
      title: '서울대학교 AI교육과정 2기',
      description: 'ChatGPT 챗봇, 미드저니, 콘텐츠, 고급 AI활용, VIBE 코딩 Web APP 제작',
      type: 'career',
    },
    {
      icon: Award,
      year: '2023',
      title: '수정중',
      description: 'Recognized for developing AI-powered solutions',
      type: 'achievement',
    },
    {
      icon: Users,
      year: '2024',
      title: '수정중',
      description: 'Leading development teams and mentoring junior developers',
      type: 'career',
    },
  ];

  // Use API data if available, otherwise use defaults
  // Only use defaults if aboutData is null (loading or error)
  const qualifications = aboutData ? (aboutData.certifications || []) : defaultQualifications;

  const timeline = aboutData
    ? (aboutData.careerTimeline || []).map((item: CareerTimelineItem) => ({
      ...item,
      icon: iconMap[item.icon || ''] || Briefcase,
    }))
    : defaultTimeline;

  return (
    <section id="about" className="py-12 md:py-16 bg-muted/30" aria-labelledby="about-heading">
      <div className="container mx-auto px-4">
        {/* Title with Animation */}
        <div className="text-center mb-24 animate-fade-in-up">
          <h2 id="about-heading" className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
            <span className="gradient-text-animated">Portfolio Owner's Story</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            기술과 창의성으로 가치를 만들어가는 여정
          </p>
        </div>

        {/* Two Column Layout - Desktop */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
            {/* Left: Profile */}
            <div className="flex flex-col items-center justify-center animate-fade-in-up lg:pl-16">
              <div className="relative mb-6">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-primary via-accent to-secondary p-1 animate-float">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                    {aboutData?.profileImage ? (
                      <img
                        src={aboutData.profileImage}
                        alt={aboutData.name || 'Profile'}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-7xl md:text-8xl" role="img" aria-label="Profile icon">
                        👤
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                {aboutData?.name || 'WON KIM'}
              </h3>
              <p className="text-lg text-muted-foreground mb-6 text-center">
                {aboutData?.title || '안녕하세요. 김원 입니다. 만나서 반갑습니다.'}
              </p>
              <div className="flex gap-4">
                <Button
                  className="btn-hero"
                  onClick={() => scrollToSection('projects')}
                  aria-label="Explore projects"
                >
                  Explore Projects
                </Button>
                <Button
                  className="btn-secondary-hero"
                  onClick={() => scrollToSection('contact')}
                  aria-label="View resume"
                >
                  View Resume
                </Button>
              </div>
            </div>

            {/* Right: Introduction Text */}
            <div className="flex flex-col justify-center space-y-6 animate-fade-in-delayed">
              {aboutData?.biography ? (
                <p className="text-lg md:text-xl leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {aboutData.biography}
                </p>
              ) : (
                <>
                  <p className="text-lg md:text-xl leading-relaxed text-foreground/90">
                    안녕하세요! 저는 기술과 창의성을 결합하여, 혁신적인 솔루션을 만드는 것을
                    좋아합니다.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-foreground/90">
                    최신 기술 트렌드를 빠르게 습득하려 노력하고, 이를 실제 프로젝트에 적용하여,
                    비즈니스 가치를 창출하는 것을 목표로 합니다.
                  </p>
                  <p className="text-lg md:text-xl leading-relaxed text-foreground/90">
                    AI, 웹 개발, 그리고 사용자 경험 디자인에 깊은 관심을 가지고 있으며, 지속적인
                    학습과 성장을 추구합니다.
                  </p>
                </>
              )}

              {/* Qualifications List - 2 columns with equal width */}
              <div className="mt-4 pt-3">
                <h4 className="text-lg font-bold mb-3 text-foreground">자격 및 이력</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                  {qualifications.map((qualification: Certification | string, index: number) => {
                    // Handle both string and object formats
                    const name = typeof qualification === 'string' ? qualification : qualification.name;
                    const details = typeof qualification === 'object' ? qualification : null;
                    const key = details?.id || `${name}-${details?.issuer || index}`;

                    return (
                      <div key={key} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary mt-1 flex-shrink-0">•</span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm md:text-sm font-medium break-words">{name}</span>
                          {details && (details.issuer || details.date) && (
                            <span className="text-xs text-muted-foreground/80 break-words">
                              {details.issuer} {details.issuer && details.date && '•'} {details.date}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Career Timeline - Tree Structure */}
          <div className="relative py-12 mb-20">
            {/* Horizontal Timeline Line - positioned at icon/year center */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-accent/40 to-primary/20 hidden md:block"
              style={{ top: '52px' }}
              aria-hidden="true"
            ></div>

            {/* Timeline Items - Dynamic columns based on item count */}
            <div
              className={`grid grid-cols-1 gap-8 md:gap-4 relative ${timeline.length <= 2
                  ? 'md:grid-cols-2'
                  : timeline.length === 3
                    ? 'md:grid-cols-3'
                    : timeline.length === 4
                      ? 'md:grid-cols-4'
                      : timeline.length === 5
                        ? 'md:grid-cols-5'
                        : 'md:grid-cols-6'
                }`}
            >
              {timeline.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex flex-col items-center animate-fade-in-up relative"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    {/* Vertical Branch Line */}
                    <div
                      className="absolute w-0.5 bg-gradient-to-b from-accent/60 to-transparent hidden md:block"
                      style={{
                        top: '52px',
                        height: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                      aria-hidden="true"
                    ></div>

                    {/* Icon Circle */}
                    <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg mb-4 hover:scale-110 transition-transform duration-300 border-4 border-background">
                      <Icon className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>

                    {/* Year Badge */}
                    <span className="relative z-10 text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-4 border border-primary/20">
                      {item.year}
                    </span>

                    {/* Title */}
                    <h4 className="text-base font-bold text-center mb-1 leading-tight">
                      {item.title}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[200px]">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Three Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-card rounded-xl p-6 hover:scale-105 hover:shadow-xl hover:border-primary transition-all duration-300 cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`${feature.color} p-6 rounded-full bg-muted/50`}>
                      <Icon className="h-12 w-12" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
