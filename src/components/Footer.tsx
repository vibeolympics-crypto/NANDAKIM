import { Mail, Phone, MapPin, Github, Youtube, Twitter, Instagram } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import apiClient from '@/lib/apiClient';
import { ThreadsIcon } from './icons/ThreadsIcon';

interface FooterLink {
  id: string;
  label: string;
  href: string;
  order: number;
}

interface FooterContent {
  companyInfo: string;
  quickLinks: FooterLink[];
  resources: FooterLink[];
  copyright: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    linkedin?: string;
    threads?: string;
  };
}

export const Footer = () => {
  const [footerContent, setFooterContent] = useState<FooterContent>({
    companyInfo:
      'Building innovative solutions and sharing knowledge through projects, blog posts, and videos.',
    quickLinks: [
      { id: '1', label: 'About', href: '#about', order: 1 },
      { id: '2', label: 'Projects', href: '#projects', order: 2 },
      { id: '3', label: 'Content', href: '#blog', order: 3 },
      { id: '4', label: 'Contact', href: '#contact', order: 4 },
      { id: '5', label: 'Map', href: '#map', order: 5 },
    ],
    resources: [
      { id: '1', label: 'Documentation', href: '#docs', order: 1 },
      { id: '2', label: 'Tutorials', href: '#tutorials', order: 2 },
      { id: '3', label: 'Help Center', href: '#help', order: 3 },
      { id: '4', label: 'Community', href: '#community', order: 4 },
      { id: '5', label: 'Support', href: '#support', order: 5 },
    ],
    copyright: '2025 ❤️ Made with lovable and VibeCoding.',
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: 'airroad1004@gmail.com',
    phone: '010-8887-9487',
    address: 'seoul, korea',
    socialMedia: {
      twitter: 'https://twitter.com/',
      linkedin: 'https://linkedin.com/in/',
      threads: 'https://threads.net/@',
      instagram: 'https://instagram.com/',
      youtube: 'https://youtube.com/',
    },
  });

  useEffect(() => {
    const loadFooterData = async () => {
      try {
        const response = await apiClient.get<{
          contact: ContactInfo;
          footer: FooterContent;
          map?: any;
        }>('/api/content/contact');
        if (response.ok && response.data) {
          // apiClient already unwraps the data, so response.data contains { contact, footer, map }
          if (response.data.footer) {
            setFooterContent(response.data.footer);
          }
          if (response.data.contact) {
            setContactInfo(response.data.contact);
          }
        }
      } catch (error) {
        console.error('Failed to load footer data:', error);
      }
    };
    loadFooterData();
  }, []);

  const quickLinks = footerContent.quickLinks;

  const scrollToSection = (id: string) => {
    // Remove # if present and convert to lowercase for case-insensitive matching
    const cleanId = id.replace('#', '').toLowerCase();
    const element = document.getElementById(cleanId);
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

  const supportTools = footerContent.resources;

  const socialButtons: Array<{
    key: keyof ContactInfo['socialMedia'];
    icon: ComponentType<any>;
    label: string;
    className: string;
    fallbackKey?: keyof ContactInfo['socialMedia'];
  }> = [
    { key: 'twitter', icon: Twitter, label: 'Twitter', className: 'bg-[#1DA1F2]' },
    {
      key: 'instagram',
      icon: Instagram,
      label: 'Instagram',
      className: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]'
    },
    { key: 'youtube', icon: Youtube, label: 'YouTube', className: 'bg-[#FF0000]' },
    { key: 'github', icon: Github, label: 'GitHub', className: 'bg-muted text-foreground' },
    {
      key: 'threads',
      fallbackKey: 'linkedin',
      icon: ThreadsIcon,
      label: 'Threads',
      className: 'bg-[#000000] text-white'
    },
  ];

  const contactEmail = contactInfo.email || 'hello@example.com';
  const contactPhone = contactInfo.phone || '+82 10-0000-0000';
  const sanitizedPhone = contactPhone.replace(/\s/g, '');
  const contactAddress = contactInfo.address || 'Seoul, South Korea';

  return (
    <footer className="bg-muted/30 border-t border-border" role="contentinfo">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-4 md:mb-8">
          {/* Brand */}
          <div>
            <div className="mb-2 md:mb-4">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-xl font-black cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded text-left leading-tight"
                aria-label="Scroll to top"
              >
                <div className="gradient-text-animated">PORTFOLIO</div>
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-2 md:mb-4 leading-snug">
              {footerContent.companyInfo}
            </p>
          </div>

          {/* Quick Links */}
          <nav aria-labelledby="quick-links-heading">
            <h3 id="quick-links-heading" className="text-base md:text-lg font-bold mb-2 md:mb-4">
              <span className="gradient-text-animated">Quick Links</span>
            </h3>
            <ul className="space-y-0.5 md:space-y-1">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href.replace('#', ''))}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded text-left leading-snug block"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-labelledby="resources-heading">
            <h3 id="resources-heading" className="text-base md:text-lg font-bold mb-2 md:mb-4">
              <span className="gradient-text-animated">Resources</span>
            </h3>
            <ul className="space-y-0.5 md:space-y-1">
              {supportTools.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded block leading-snug"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Get In Touch / Contact Info */}
          <div>
            <h3 className="text-base md:text-lg font-bold mb-2 md:mb-4">
              <span className="gradient-text-animated">Get In Touch</span>
            </h3>
            <div className="space-y-1.5 md:space-y-2 text-sm text-muted-foreground" aria-label="Contact information">
              <div className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <a href={`mailto:${contactEmail}`} className="hover:text-primary transition-colors break-all">
                  {contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <a href={`tel:${sanitizedPhone}`} className="hover:text-primary transition-colors">
                  {contactPhone}
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 md:gap-1.5 mt-3 md:mt-4" role="list" aria-label="Social media links">
              {socialButtons.map(({ key, fallbackKey, icon: Icon, label, className }) => {
                const primaryUrl = contactInfo.socialMedia?.[key];
                const fallbackUrl = fallbackKey ? contactInfo.socialMedia?.[fallbackKey] : undefined;
                const url = primaryUrl || fallbackUrl;
                const isFallback = !primaryUrl && Boolean(fallbackUrl);
                if (!url) {
                  return null;
                }
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center text-foreground hover:text-primary hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label={`Connect on ${label}${isFallback ? ' (link uses LinkedIn profile)' : ''}`}
                    role="listitem"
                  >
                    <Icon className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar - 사각 테두리 제거, 가로선만 유지 */}
        <div className="border-t border-border pt-4 md:pt-6 mt-4 md:mt-6">
          <p className="text-xs text-muted-foreground text-center leading-relaxed px-4">
            © 2025 WON KIM. All rights reserved. Made with ❤️ for the community.
          </p>
        </div>
      </div>
    </footer>
  );
};
