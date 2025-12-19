import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton UI components for dynamic content layout reservation
 * Prevents Cumulative Layout Shift (CLS) during content loading
 *
 * Requirements: 5.4 - Dynamic content layout reservation
 * Validates: Requirement 5.4 - Layout stability during loading
 */

/**
 * Skeleton for Featured Projects section
 * Matches the 3-column grid layout with card structure
 */
export const FeaturedProjectsSkeleton = () => {
  return (
    <div className="bg-background py-20">
      <div className="container mx-auto px-4">
        {/* Header Skeleton */}
        <div className="text-center mb-16">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Grid Layout - 3 columns matching FeaturedHighlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div
              key={index}
              className="bg-card rounded-2xl overflow-hidden"
              style={{
                animationDelay: `${index * 100}ms`,
                minHeight: '384px', // Reserve space: 256px image + 128px content
              }}
            >
              {/* Image Skeleton - 16:9 aspect ratio */}
              <Skeleton className="h-64 w-full" />

              {/* Content Skeleton */}
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for Blog Timeline Section
 * Matches the timeline layout with expandable posts
 */
export const BlogTimelineSkeleton = () => {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="bg-card rounded-lg p-6 border border-border"
          style={{ minHeight: '200px' }}
        >
          <div className="flex items-start gap-4">
            {/* Date badge skeleton */}
            <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />

            <div className="flex-1 space-y-3">
              {/* Title */}
              <Skeleton className="h-6 w-3/4" />

              {/* Content preview */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>

              {/* Tags */}
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-18 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for SNS Platform Columns
 * Matches the 4-column grid layout with platform-specific cards
 */
export const SNSPlatformColumnsSkeleton = () => {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-auto">
      {['twitter', 'threads', 'instagram', 'youtube'].map((platform) => (
        <div key={platform} className="platform-column">
          {/* Platform header skeleton */}
          <div className="mb-4">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Platform cards skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-lg p-4 border border-border"
                style={{ minHeight: '120px' }}
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-20 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for Contact Form Section
 * Matches the form layout with input fields
 */
export const ContactFormSkeleton = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-lg p-8 border border-border">
        <div className="space-y-6">
          {/* Name field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Email field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Message field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 w-full" />
          </div>

          {/* Submit button */}
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for About Section
 * Matches the about content layout
 */
export const AboutSectionSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-48 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Skills or highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for Map Section
 * Reserves space for the map iframe
 */
export const MapSectionSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-40 mx-auto mb-4" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>

        {/* Map container - 16:9 aspect ratio */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <Skeleton className="absolute inset-0 w-full h-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};

/**
 * Generic content skeleton for lazy-loaded sections
 * Can be used as a fallback for any section
 */
export const GenericContentSkeleton = ({ height = '400px' }: { height?: string }) => {
  return (
    <div className="container mx-auto px-4 py-16" style={{ minHeight: height }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-6 w-96 mx-auto" />
        <div className="space-y-4 mt-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
};
