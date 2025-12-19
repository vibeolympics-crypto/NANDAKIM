import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  stats: string;
  badge?: string;
  iconColor?: string;
  badgeType?: 'trending' | 'featured';
  index?: number; // For staggered animation
}

export const CategoryCard = ({
  icon: Icon,
  title,
  description,
  stats,
  badge,
  iconColor = 'text-primary',
  badgeType = 'trending',
  index = 0,
}: CategoryCardProps) => {
  return (
    <article
      className="group bg-card rounded-2xl p-6 card-morph liquid-morph ripple-effect cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      style={{ animationDelay: `${index * 100}ms` }}
      tabIndex={0}
      role="button"
      aria-label={`${title} category - ${description} - ${stats}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-3 rounded-xl bg-muted', iconColor)} aria-hidden="true">
          <Icon className="h-8 w-8" />
        </div>
        {badge && (
          <span
            className={cn(badgeType === 'featured' ? 'badge-featured' : 'badge-trending')}
            aria-label={`${badge} badge`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs font-semibold text-muted-foreground pt-2">{stats}</p>
      </div>
    </article>
  );
};
