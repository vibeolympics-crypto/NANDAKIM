import { Users, Star } from 'lucide-react';
import projectsData from '@/data/projects.json';

interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  technologies: string[];
  year: string;
  category: string;
  links: {
    demo: string;
    github: string;
  };
}

// Featured Projects 최대 표시 개수
const MAX_PROJECTS = 6;

export const FeaturedHighlights = () => {
  // Load featured projects from imported JSON data (최대 6개)
  const projects: ProjectDetail[] = projectsData.projects
    .filter((p: any) => p.featured)
    .sort((a: any, b: any) => a.order - b.order)
    .slice(0, MAX_PROJECTS);

  const handleMoreClick = (project: ProjectDetail) => {
    // 모든 링크를 새 탭에서 열기
    window.open(project.links.demo, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 id="featured-heading" className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
            <span className="gradient-text-animated">Featured Projects</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            프로젝트 포트폴리오
          </p>
        </div>

        {/* Grid Layout - 3 columns on desktop, responsive on smaller screens */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
          role="list"
        >
          {projects.map((item, index) => (
            <article
              key={item.id}
              className="group relative bg-card rounded-2xl overflow-hidden card-morph shimmer glow-pulse animate-fade-in-up focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              style={{ animationDelay: `${index * 100}ms` }}
              role="listitem"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={`${item.title} - ${item.description}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/20"
                  aria-hidden="true"
                ></div>

                {/* Badge */}
                <div className="absolute top-4 left-4">
                  <span className="badge-trending" aria-label={`Year: ${item.year}`}>
                    {item.year}
                  </span>
                </div>

                {/* More Button - Show on hover */}
                <button
                  onClick={() => handleMoreClick(item)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 backdrop-blur-md text-white font-semibold hover:shadow-2xl hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black opacity-0 group-hover:opacity-100 border border-white/20 hover:border-white/40 flex items-center justify-center gap-2 group"
                  aria-label={`프로젝트 보러가기 ${item.title}`}
                >
                  <span>Play</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                {/* Stats */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div
                    className="flex items-center gap-3 text-white text-sm mb-2"
                    role="list"
                    aria-label="Project statistics"
                  >
                    <span className="flex items-center gap-1" role="listitem">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      <span aria-label={`Category: ${item.category}`}>{item.category}</span>
                    </span>
                    <span className="flex items-center gap-1" role="listitem">
                      <Star
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        aria-hidden="true"
                      />
                      <span aria-label={`${item.technologies.length} technologies used`}>
                        {item.technologies.length} techs
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
