import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

export interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  thumbnail: string;
  projectUrl: string;
  technologies: string[];
  year: string;
  category: string;
}

interface ProjectDetailModalProps {
  project: ProjectDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDetailModal = ({ project, isOpen, onClose }: ProjectDetailModalProps) => {
  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if not open or no project
  if (!isOpen || !project) {
    return null;
  }

  // Handle click outside to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle direct link click
  const handleDirectLinkClick = () => {
    window.open(project.projectUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ margin: 'auto' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>

        {/* Modal Content */}
        <div className="p-6 md:p-8">
          {/* Project Title */}
          <h2
            id="modal-title"
            className="text-2xl md:text-3xl font-bold text-foreground mb-2 pr-12"
          >
            {project.title}
          </h2>

          {/* Project Metadata */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-muted-foreground">{project.year}</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{project.category}</span>
          </div>

          {/* Technologies */}
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {project.technologies.map((tech, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Full Description */}
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none mb-6">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {project.fullDescription}
            </p>
          </div>

          {/* Direct Link Button */}
          <button
            onClick={handleDirectLinkClick}
            className="w-full md:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center gap-2"
            aria-label={`Visit ${project.title} project`}
          >
            <span>프로젝트 방문하기</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
