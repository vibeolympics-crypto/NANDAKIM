import { useState, useEffect, useRef } from 'react';
import { Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  onThemeChange?: (theme: 'dark' | 'light') => void;
}

export const Header = ({ onThemeChange }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Initialize theme from localStorage or default to 'dark'
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
      return savedTheme || 'dark';
    }
    return 'dark';
  });
  const [isContentDropdownOpen, setIsContentDropdownOpen] = useState(false);
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
  const contentDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize theme on mount
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }

    // Cleanup function to clear any pending timeouts
    return () => {
      const timeoutId = (window as any).__themeTransitionTimeout;
      if (timeoutId) {
        clearTimeout(timeoutId);
        delete (window as any).__themeTransitionTimeout;
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      setIsMobileMenuOpen(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    // Add theme-transition class to document for smooth transitions
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('theme-transition');

      // Update CSS class
      if (newTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }

      // Remove transition class after animation completes (150ms - faster)
      const timeoutId = setTimeout(() => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('theme-transition');
        }
      }, 150);

      // Store timeout ID for cleanup
      (window as any).__themeTransitionTimeout = timeoutId;
    }

    // Persist theme to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }

    onThemeChange?.(newTheme);
  };

  const contentSubItems = [
    { label: 'Blog', id: 'blog' },
    { label: 'SNS', id: 'sns' },
    { label: 'News', id: 'ai-vibe-news' },
    { label: 'YouTube', id: 'youtube' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentDropdownRef.current &&
        !contentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsContentDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-background/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}
      role="banner"
    >
      <nav className="container mx-auto px-4 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-20 md:grid md:grid-cols-3">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.location.reload()}
            role="button"
            aria-label="Reload page"
          >
            <span className="text-xl font-black gradient-text-animated">PORTFOLIO</span>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center justify-center gap-6 lg:gap-10" role="menubar">
            {/* About */}
            <li role="none">
              <button
                onClick={() => scrollToSection('about')}
                onMouseEnter={() => setHoveredMenuItem('about')}
                onMouseLeave={() => setHoveredMenuItem(null)}
                style={{
                  backgroundColor: hoveredMenuItem === 'about' ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
                  color: hoveredMenuItem === 'about' ? '#22c55e' : 'inherit',
                  transform: hoveredMenuItem === 'about' ? 'translateX(2px)' : 'translateX(0)',
                  boxShadow: hoveredMenuItem === 'about' ? '0 4px 12px rgba(34, 197, 94, 0.4)' : 'none',
                  fontWeight: hoveredMenuItem === 'about' ? '600' : '500',
                }}
                className="nav-menu-item focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1 whitespace-nowrap transition-all duration-200"
                role="menuitem"
                aria-label="Navigate to About section"
              >
                About
              </button>
            </li>

            {/* Projects */}
            <li role="none">
              <button
                onClick={() => scrollToSection('projects')}
                onMouseEnter={() => setHoveredMenuItem('projects')}
                onMouseLeave={() => setHoveredMenuItem(null)}
                style={{
                  backgroundColor: hoveredMenuItem === 'projects' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: hoveredMenuItem === 'projects' ? '#3b82f6' : 'inherit',
                  transform: hoveredMenuItem === 'projects' ? 'translateX(2px)' : 'translateX(0)',
                  boxShadow: hoveredMenuItem === 'projects' ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
                  fontWeight: hoveredMenuItem === 'projects' ? '600' : '500',
                }}
                className="nav-menu-item focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1 whitespace-nowrap transition-all duration-200"
                role="menuitem"
                aria-label="Navigate to Projects section"
              >
                Projects
              </button>
            </li>

            {/* Content Dropdown */}
            <li role="none" className="relative">
              <div ref={contentDropdownRef}>
                <button
                  onMouseEnter={() => setIsContentDropdownOpen(true)}
                  onMouseLeave={() => setIsContentDropdownOpen(false)}
                  onClick={() => setIsContentDropdownOpen(!isContentDropdownOpen)}
                  style={{
                    backgroundColor: hoveredMenuItem === 'content' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                    color: hoveredMenuItem === 'content' ? '#a855f7' : 'inherit',
                    transform: hoveredMenuItem === 'content' ? 'translateX(2px)' : 'translateX(0)',
                    boxShadow: hoveredMenuItem === 'content' ? '0 4px 12px rgba(168, 85, 247, 0.4)' : 'none',
                    fontWeight: hoveredMenuItem === 'content' ? '600' : '500',
                  }}
                  className="nav-menu-item focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1 whitespace-nowrap flex items-center gap-1 transition-all duration-200"
                  onMouseEnterCapture={() => setHoveredMenuItem('content')}
                  onMouseLeaveCapture={() => setHoveredMenuItem(null)}
                  role="menuitem"
                  aria-label="Content menu"
                  aria-expanded={isContentDropdownOpen}
                  aria-haspopup="true"
                >
                  Content
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${isContentDropdownOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {/* Dropdown Menu */}
                <div
                  onMouseEnter={() => setIsContentDropdownOpen(true)}
                  onMouseLeave={() => setIsContentDropdownOpen(false)}
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-background/95 backdrop-blur-lg border border-border rounded-lg shadow-lg overflow-hidden transition-all duration-300 origin-top ${
                    isContentDropdownOpen
                      ? 'opacity-100 scale-100 pointer-events-auto'
                      : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                  role="menu"
                  aria-label="Content submenu"
                >
                  {contentSubItems.map((item, index) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        scrollToSection(item.id);
                        setIsContentDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-primary/10 transition-colors focus:outline-none focus:bg-primary/20 ${
                        index !== contentSubItems.length - 1 ? 'border-b border-border/50' : ''
                      }`}
                      role="menuitem"
                      aria-label={`Navigate to ${item.label} section`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </li>

            {/* Contact */}
            <li role="none">
              <button
                onClick={() => scrollToSection('contact')}
                onMouseEnter={() => setHoveredMenuItem('contact')}
                onMouseLeave={() => setHoveredMenuItem(null)}
                style={{
                  backgroundColor: hoveredMenuItem === 'contact' ? 'rgba(249, 115, 22, 0.25)' : 'transparent',
                  color: hoveredMenuItem === 'contact' ? '#f97316' : 'inherit',
                  transform: hoveredMenuItem === 'contact' ? 'translateX(2px)' : 'translateX(0)',
                  boxShadow: hoveredMenuItem === 'contact' ? '0 4px 12px rgba(249, 115, 22, 0.4)' : 'none',
                  fontWeight: hoveredMenuItem === 'contact' ? '600' : '500',
                }}
                className="nav-menu-item focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1 whitespace-nowrap transition-all duration-200"
                role="menuitem"
                aria-label="Navigate to Contact section"
              >
                Contact
              </button>
            </li>

            {/* Map */}
            <li role="none">
              <button
                onClick={() => scrollToSection('map')}
                onMouseEnter={() => setHoveredMenuItem('map')}
                onMouseLeave={() => setHoveredMenuItem(null)}
                style={{
                  backgroundColor: hoveredMenuItem === 'map' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                  color: hoveredMenuItem === 'map' ? '#06b6d4' : 'inherit',
                  transform: hoveredMenuItem === 'map' ? 'translateX(2px)' : 'translateX(0)',
                  boxShadow: hoveredMenuItem === 'map' ? '0 4px 12px rgba(6, 182, 212, 0.4)' : 'none',
                  fontWeight: hoveredMenuItem === 'map' ? '600' : '500',
                }}
                className="nav-menu-item focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1 whitespace-nowrap transition-all duration-200"
                role="menuitem"
                aria-label="Navigate to Map section"
              >
                Map
              </button>
            </li>
          </ul>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 h-9 w-9 md:h-10 md:w-10"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              aria-pressed={theme === 'light'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 h-9 w-9"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden py-4 animate-fade-in backdrop-blur-xl border-t border-border/50"
            role="menu"
            aria-label="Mobile navigation menu"
            style={{
              position: 'relative',
              zIndex: 40,
              backgroundColor: theme === 'dark' 
                ? 'rgba(10, 10, 10, 0.92)' 
                : 'rgba(245, 245, 245, 0.95)',
              backgroundImage: theme === 'dark'
                ? 'linear-gradient(180deg, rgba(24, 184, 106, 0.05) 0%, rgba(33, 212, 253, 0.05) 100%)'
                : 'linear-gradient(180deg, rgba(24, 184, 106, 0.03) 0%, rgba(33, 212, 253, 0.03) 100%)',
            }}
          >
            <ul className="flex flex-col gap-1 px-4">
              {/* About */}
              <li role="none">
                <button
                  onClick={() => scrollToSection('about')}
                  onMouseEnter={() => setHoveredMenuItem('about')}
                  onMouseLeave={() => setHoveredMenuItem(null)}
                  style={{
                    backgroundColor: hoveredMenuItem === 'about' ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
                    color: hoveredMenuItem === 'about' ? '#22c55e' : 'inherit',
                    transform: hoveredMenuItem === 'about' ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow: hoveredMenuItem === 'about' ? '0 4px 12px rgba(34, 197, 94, 0.4)' : 'none',
                    fontWeight: hoveredMenuItem === 'about' ? '600' : '500',
                  }}
                  className="nav-menu-item w-full text-left py-3 px-3 text-foreground font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  role="menuitem"
                  aria-label="Navigate to About section"
                >
                  About
                </button>
              </li>

              {/* Projects */}
              <li role="none">
                <button
                  onClick={() => scrollToSection('projects')}
                  onMouseEnter={() => setHoveredMenuItem('projects')}
                  onMouseLeave={() => setHoveredMenuItem(null)}
                  style={{
                    backgroundColor: hoveredMenuItem === 'projects' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                    color: hoveredMenuItem === 'projects' ? '#3b82f6' : 'inherit',
                    transform: hoveredMenuItem === 'projects' ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow: hoveredMenuItem === 'projects' ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
                    fontWeight: hoveredMenuItem === 'projects' ? '600' : '500',
                  }}
                  className="nav-menu-item w-full text-left py-3 px-3 text-foreground font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  role="menuitem"
                  aria-label="Navigate to Projects section"
                >
                  Projects
                </button>
              </li>

              {/* Content Menu in Mobile */}
              <li role="none">
                <button
                  onClick={() => setIsContentDropdownOpen(!isContentDropdownOpen)}
                  onMouseEnter={() => setHoveredMenuItem('content')}
                  onMouseLeave={() => setHoveredMenuItem(null)}
                  style={{
                    backgroundColor: hoveredMenuItem === 'content' || isContentDropdownOpen ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                    color: hoveredMenuItem === 'content' || isContentDropdownOpen ? '#a855f7' : 'inherit',
                    transform: hoveredMenuItem === 'content' || isContentDropdownOpen ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow: hoveredMenuItem === 'content' || isContentDropdownOpen ? '0 4px 12px rgba(168, 85, 247, 0.4)' : 'none',
                    fontWeight: hoveredMenuItem === 'content' || isContentDropdownOpen ? '600' : '500',
                  }}
                  className="nav-menu-item w-full text-left py-3 px-3 text-foreground font-medium transition-all duration-200 rounded-lg flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  role="menuitem"
                  aria-label="Content menu"
                  aria-expanded={isContentDropdownOpen}
                >
                  Content
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${isContentDropdownOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {/* Mobile Dropdown */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isContentDropdownOpen ? 'max-h-96 opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                  style={{
                    marginTop: isContentDropdownOpen ? '8px' : '0px',
                  }}
                >
                  <ul className="pl-6 space-y-1">
                    {contentSubItems.map((item) => (
                      <li key={item.label}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToSection(item.id);
                            setIsContentDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                          onMouseEnter={() => setHoveredMenuItem(`content-${item.label}`)}
                          onMouseLeave={() => setHoveredMenuItem(null)}
                          style={{
                            backgroundColor: hoveredMenuItem === `content-${item.label}` ? 'rgba(236, 72, 153, 0.25)' : 'transparent',
                            color: hoveredMenuItem === `content-${item.label}` ? '#ec4899' : 'inherit',
                            transform: hoveredMenuItem === `content-${item.label}` ? 'translateX(4px)' : 'translateX(0)',
                            fontWeight: hoveredMenuItem === `content-${item.label}` ? '600' : '500',
                          }}
                          className="nav-menu-item w-full text-left py-2 px-3 text-sm text-foreground transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          role="menuitem"
                          aria-label={`Navigate to ${item.label} section`}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>

              {/* Contact */}
              <li role="none">
                <button
                  onClick={() => scrollToSection('contact')}
                  onMouseEnter={() => setHoveredMenuItem('contact')}
                  onMouseLeave={() => setHoveredMenuItem(null)}
                  style={{
                    backgroundColor: hoveredMenuItem === 'contact' ? 'rgba(249, 115, 22, 0.25)' : 'transparent',
                    color: hoveredMenuItem === 'contact' ? '#f97316' : 'inherit',
                    transform: hoveredMenuItem === 'contact' ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow: hoveredMenuItem === 'contact' ? '0 4px 12px rgba(249, 115, 22, 0.4)' : 'none',
                    fontWeight: hoveredMenuItem === 'contact' ? '600' : '500',
                  }}
                  className="nav-menu-item w-full text-left py-3 px-3 text-foreground font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  role="menuitem"
                  aria-label="Navigate to Contact section"
                >
                  Contact
                </button>
              </li>

              {/* Map */}
              <li role="none">
                <button
                  onClick={() => scrollToSection('map')}
                  onMouseEnter={() => setHoveredMenuItem('map')}
                  onMouseLeave={() => setHoveredMenuItem(null)}
                  style={{
                    backgroundColor: hoveredMenuItem === 'map' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                    color: hoveredMenuItem === 'map' ? '#06b6d4' : 'inherit',
                    transform: hoveredMenuItem === 'map' ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow: hoveredMenuItem === 'map' ? '0 4px 12px rgba(6, 182, 212, 0.4)' : 'none',
                    fontWeight: hoveredMenuItem === 'map' ? '600' : '500',
                  }}
                  className="nav-menu-item w-full text-left py-3 px-3 text-foreground font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  role="menuitem"
                  aria-label="Navigate to Map section"
                >
                  Map
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};
