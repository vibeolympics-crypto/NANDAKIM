import { useState, useEffect } from 'react';
import { Twitter, Instagram, Youtube, Github } from 'lucide-react';
import { ThreadsIcon } from './icons/ThreadsIcon';
import apiClient from '@/lib/apiClient';

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

interface SNSContactIconsProps {
  /**
   * Custom class name for the container
   */
  className?: string;
  /**
   * Size variant: 'sm' | 'md' | 'lg'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Icon style - filled or outline
   */
  showLabels?: boolean;
}

/**
 * SNSContactIcons - Displays social media contact icons for the operator
 * Used in Blog & Social section for easy access to operator's social profiles
 */
export function SNSContactIcons({
  className = '',
  size = 'md',
  showLabels = false,
}: SNSContactIconsProps) {
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
    const loadContactInfo = async () => {
      try {
        const response = await apiClient.get<{ contact: ContactInfo; footer?: any; map?: any }>(
          '/api/content/contact'
        );
        if (response.ok && response.data) {
          setContactInfo(response.data.contact);
        }
      } catch (error) {
        console.error('[SNSContactIcons] Failed to load contact info:', error);
      }
    };
    loadContactInfo();
  }, []);

  // Size mapping
  const sizeClasses = {
    sm: 'w-8 h-8 md:w-9 md:h-9',
    md: 'w-10 h-10 md:w-11 md:h-11',
    lg: 'w-12 h-12 md:w-14 md:h-14',
  };

  const iconSizes = {
    sm: 'h-4 w-4 md:h-4 md:w-4',
    md: 'h-5 w-5 md:h-6 md:w-6',
    lg: 'h-6 w-6 md:h-7 md:w-7',
  };

  // Get threads URL (fallback to linkedin if threads not available)
  const threadsUrl = contactInfo?.socialMedia?.threads || contactInfo?.socialMedia?.linkedin || null;

  // SNS icon configuration with platform colors and labels
  const snsIcons = [
    {
      key: 'twitter',
      icon: Twitter,
      label: 'Twitter',
      url: contactInfo?.socialMedia?.twitter,
      color: '#1DA1F2',
      bgClass: 'bg-[#1DA1F2] text-white hover:bg-[#1a8cd8]',
      ringClass: 'focus:ring-[#1DA1F2]',
    },
    {
      key: 'threads',
      icon: ThreadsIcon,
      label: 'Threads',
      url: threadsUrl,
      color: '#000000',
      bgClass: 'bg-[#000000] text-white hover:bg-gray-800',
      ringClass: 'focus:ring-[#000000]',
    },
    {
      key: 'instagram',
      icon: Instagram,
      label: 'Instagram',
      url: contactInfo?.socialMedia?.instagram,
      color: '#E4405F',
      bgClass: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90',
      ringClass: 'focus:ring-[#E4405F]',
    },
    {
      key: 'youtube',
      icon: Youtube,
      label: 'YouTube',
      url: contactInfo?.socialMedia?.youtube,
      color: '#FF0000',
      bgClass: 'bg-[#FF0000] text-white hover:bg-[#cc0000]',
      ringClass: 'focus:ring-[#FF0000]',
    },
    {
      key: 'github',
      icon: Github,
      label: 'GitHub',
      url: contactInfo?.socialMedia?.github,
      color: '#333333',
      bgClass: 'bg-muted text-foreground hover:bg-muted/80',
      ringClass: 'focus:ring-muted',
    },
  ];

  // Filter out empty URLs
  const availableIcons = snsIcons.filter(item => item.url && item.url !== '#');

  if (availableIcons.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center gap-3 md:gap-4 ${className}`}
      role="list"
      aria-label="연락처 소셜 미디어"
    >
      {availableIcons.map(item => {
        const IconComponent = item.icon;
        return (
          <a
            key={item.key}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${sizeClasses[size]} rounded-full ${item.bgClass} flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 ${item.ringClass} focus:ring-offset-2`}
            aria-label={`${item.label}에서 연락하기`}
            role="listitem"
            title={item.label}
          >
            <IconComponent className={iconSizes[size]} aria-hidden="true" />
            {showLabels && (
              <span className="ml-2 text-xs font-semibold whitespace-nowrap hidden md:inline">
                {item.label}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}

export default SNSContactIcons;
