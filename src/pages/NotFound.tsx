import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureSentryException } from '@/lib/sentry';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log 404 errors for monitoring
    if (import.meta.env.DEV) {
      console.error('404 Error: User attempted to access non-existent route:', location.pathname);
    }

    // Send to error tracking in production
    captureSentryException(new Error(`404 Not Found: ${location.pathname}`), {
      level: 'warning',
      tags: { type: '404' },
      extra: { pathname: location.pathname },
    });
  }, [location.pathname]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4"
      role="main"
      aria-labelledby="not-found-title"
    >
      <div className="text-center max-w-2xl animate-fade-in">
        {/* 404 Icon */}
        <div className="mb-8 flex justify-center" aria-hidden="true">
          <div className="relative">
            <div className="text-9xl font-black gradient-text-animated">404</div>
            <div className="absolute -top-4 -right-4 text-6xl animate-float">😕</div>
          </div>
        </div>

        {/* Title */}
        <h1 
          id="not-found-title" 
          className="mb-4 text-3xl md:text-4xl font-bold text-foreground"
        >
          Page Not Found
        </h1>
        
        {/* Description */}
        <p className="mb-8 text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>

        {/* Requested Path */}
        <div className="mb-8 px-4 py-2 bg-muted rounded-lg inline-block">
          <code className="text-sm text-muted-foreground">
            <Search className="inline h-4 w-4 mr-2" aria-hidden="true" />
            {location.pathname}
          </code>
        </div>

        {/* Action Buttons */}
        <div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          role="group"
          aria-label="Navigation options"
        >
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full sm:w-auto"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="btn-hero w-full sm:w-auto"
            aria-label="Return to homepage"
          >
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            Go to Homepage
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">You might be interested in:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="/#about" 
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
              aria-label="View About section"
            >
              About
            </a>
            <a 
              href="/#projects" 
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
              aria-label="View Projects"
            >
              Projects
            </a>
            <a 
              href="/#blog" 
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
              aria-label="View Blog"
            >
              Blog
            </a>
            <a 
              href="/#contact" 
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
              aria-label="Contact Us"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
